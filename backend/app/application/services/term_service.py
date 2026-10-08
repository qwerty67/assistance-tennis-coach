from __future__ import annotations
"""Terms: enrollment + pricing + schedule generation + charge generation in a single workflow."""
import uuid
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.application.schemas.classes import ScheduleIn, TermCreate, TermUpdate
from app.application.services.finance_service import FinanceService
from app.application.services.notification_service import NotificationService
from app.application.services.usage import remaining_sessions, session_counts, used_sessions
from app.core.exceptions import ValidationError
from app.domain.enums import (
    BillingMode, NotificationType, ScheduleType, SessionChangeType, SessionStatus, TermStatus, TermType,
)
from app.domain.pricing import PriceBreakdown, per_student_shares
from app.domain.scheduling import Slot, generate_custom, generate_recurring
from app.infrastructure.db.models import (
    ClassMember, Schedule, ScheduleSlot, SessionChangeLog, Student, TennisClass, Term, TermMember,
    TrainingSession,
)
from app.infrastructure.db.types import utcnow
from app.infrastructure.repositories.base import Repository


class TermService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = Repository(db)
        self.finance = FinanceService(db)

    # ------------------------------------------------------------------ output
    def to_out(self, actor: Actor, t: Term) -> dict:
        c = self.db.get(TennisClass, t.class_id)
        d = {k: getattr(t, k) for k in (
            "id", "class_id", "title", "term_type", "total_sessions", "start_date", "end_date", "session_price",
            "court_cost", "coach_income", "monthly_fee", "total_price", "billing_mode", "payer_student_id",
            "payment_plan", "installments_count", "status", "notes")}
        d["class_name"], d["class_type"] = c.name, c.class_type.value
        today = actor.today()
        members = []
        for m in t.members:
            s = self.db.get(Student, m.student_id)
            if not s:
                continue
            lines = [x for x in self.finance.charges_with_status(s, today) if x["term_id"] == t.id]
            acc = s.account
            members.append({
                "student_id": s.id, "full_name": s.full_name, "share_per_session": m.share_per_session,
                "share_overridden": m.share_overridden, "used_sessions": used_sessions(self.db, t.id, s.id),
                "remaining_sessions": remaining_sessions(self.db, t, s.id),
                "total_due": sum(x["amount"] for x in lines), "paid": sum(x["paid"] for x in lines),
                "financial_status": acc.status if acc else "settled",
            })
        d["members"] = members
        counts = session_counts(self.db, t.id)
        d["sessions_scheduled"] = counts["scheduled"]
        d["sessions_completed"] = counts["completed"]
        d["sessions_cancelled"] = counts["cancelled"]
        active = counts["scheduled"] + counts["completed"]
        missing = (t.total_sessions - active) if t.total_sessions else 0
        d["makeup_needed"] = max(0, missing)
        d["makeup_suggestion"] = (
            f"برای جبران {missing} جلسه لغوشده، جلسه جدید در زمان مناسب ایجاد کنید." if missing > 0 else None
        )
        return d

    def list(self, actor: Actor, class_id=None, student_id=None, status=None) -> list[dict]:
        stmt = select(Term).where(Term.coach_id == actor.coach_id, Term.deleted_at.is_(None))
        if class_id:
            stmt = stmt.where(Term.class_id == class_id)
        if student_id:
            stmt = stmt.join(TermMember, TermMember.term_id == Term.id).where(TermMember.student_id == student_id)
        if status:
            stmt = stmt.where(Term.status == status)
        return [self.to_out(actor, t) for t in self.db.scalars(stmt.order_by(Term.start_date.desc()))]

    def get(self, actor: Actor, term_id: uuid.UUID) -> dict:
        return self.to_out(actor, self.repo.get_owned(Term, term_id, actor.coach_id))

    # ------------------------------------------------------------------ create
    def create(self, actor: Actor, data: TermCreate) -> dict:
        c = self.repo.get_owned(TennisClass, data.class_id, actor.coach_id)
        sp = data.session_price if data.session_price is not None else c.session_price
        cc = data.court_cost if data.court_cost is not None else (c.court_cost if sp == c.session_price else 0)
        price = PriceBreakdown.build(sp, cc, data.coach_income)
        monthly_fee = data.monthly_fee if data.monthly_fee is not None else c.monthly_fee
        mode = data.billing_mode or c.billing_mode

        # members
        if data.members is not None:
            member_inputs = data.members
        else:
            from app.application.schemas.classes import TermMemberIn
            member_inputs = [TermMemberIn(student_id=m.student_id) for m in c.members if m.is_active]
        if not member_inputs:
            raise ValidationError("A term needs at least one student", code="no_members")
        if len(member_inputs) > c.capacity_max:
            raise ValidationError("Too many students for this class", code="class_full")
        ids = [m.student_id for m in member_inputs]
        for sid in ids:
            self.repo.get_owned(Student, sid, actor.coach_id)
            if not self.db.scalar(select(ClassMember).where(ClassMember.class_id == c.id, ClassMember.student_id == sid)):
                self.db.add(ClassMember(class_id=c.id, student_id=sid, joined_at=actor.today()))

        payer_index = 0
        if mode == BillingMode.LUMP:
            payer = data.payer_student_id or ids[0]
            if payer not in ids:
                raise ValidationError("Payer must be a member of the term", code="invalid_payer")
            payer_index = ids.index(payer)
        base = monthly_fee if data.term_type == TermType.MONTHLY else price.session_price
        shares = per_student_shares(base, len(ids), mode, payer_index)

        term = Term(
            coach_id=actor.coach_id, class_id=c.id, title=data.title, term_type=data.term_type,
            total_sessions=data.total_sessions, start_date=data.start_date, end_date=data.end_date,
            session_price=price.session_price, court_cost=price.court_cost, coach_income=price.coach_income,
            monthly_fee=monthly_fee, billing_mode=mode,
            payer_student_id=ids[payer_index] if mode == BillingMode.LUMP else None,
            payment_plan=data.payment_plan, installments_count=data.installments_count,
            status=TermStatus.ACTIVE, notes=data.notes,
        )
        self.db.add(term)
        self.db.flush()
        for m_in, share in zip(member_inputs, shares):
            overridden = m_in.share_per_session is not None
            term.members.append(TermMember(student_id=m_in.student_id,
                                           share_per_session=m_in.share_per_session if overridden else share,
                                           share_overridden=overridden))
        self._recompute_total(term)

        if data.schedule:
            self._generate_sessions(actor, term, c, data.schedule)

        self.db.flush()
        self.finance.generate_term_charges(term, c, term.members)
        self.db.flush()
        self.finance.recalc_many(ids, actor.today())
        students = [self.db.get(Student, i) for i in ids]
        NotificationService(self.db).notify_students(
            students, NotificationType.SESSION_CREATED, "ترم جدید",
            f"ترم «{term.title}» برای شما ثبت شد.", {"term_id": str(term.id)},
        )
        self.db.commit()
        return self.to_out(actor, term)

    def _recompute_total(self, term: Term) -> None:
        per = sum(m.share_per_session for m in term.members)
        term.total_price = per if term.term_type == TermType.MONTHLY else per * (term.total_sessions or 0)

    def _generate_sessions(self, actor: Actor, term: Term, c: TennisClass, sched: ScheduleIn) -> list[TrainingSession]:
        tz = actor.coach.timezone
        start = sched.start_date or term.start_date
        end = sched.end_date or term.end_date
        slots = [Slot(s.start_time, s.end_time, s.weekday, s.on_date) for s in sched.slots]
        if sched.schedule_type == ScheduleType.RECURRING:
            if term.term_type == TermType.MONTHLY and not end:
                end = start + timedelta(days=30)
            occ = generate_recurring(slots, start, tz, end_date=end, max_count=term.total_sessions)
        else:
            occ = generate_custom(slots, tz)
        if not occ:
            raise ValidationError("Schedule produced no sessions", code="empty_schedule")
        schedule = Schedule(class_id=c.id, term_id=term.id, schedule_type=sched.schedule_type,
                            start_date=start, end_date=end, timezone=tz)
        schedule.slots = [ScheduleSlot(weekday=s.weekday, on_date=s.on_date, start_time=s.start_time,
                                       end_time=s.end_time) for s in sched.slots]
        self.db.add(schedule)
        self.db.flush()
        created = []
        for i, o in enumerate(occ, start=1):
            s = TrainingSession(
                coach_id=actor.coach_id, class_id=c.id, term_id=term.id, schedule_id=schedule.id, sequence_number=i,
                start_at=o.start_at, end_at=o.end_at, status=SessionStatus.SCHEDULED, session_price=term.session_price,
                court_cost=term.court_cost, coach_income=term.coach_income, location=c.location,
            )
            self.db.add(s)
            created.append(s)
        self.db.flush()
        for s in created:
            self.db.add(SessionChangeLog(session_id=s.id, changed_by_user_id=actor.user.id,
                                         change_type=SessionChangeType.CREATED, new_start_at=s.start_at,
                                         new_end_at=s.end_at))
        if not term.end_date:
            term.end_date = occ[-1].start_at.astimezone(actor.tz).date()
        return created

    def add_schedule(self, actor: Actor, term_id: uuid.UUID, sched: ScheduleIn) -> dict:
        term = self.repo.get_owned(Term, term_id, actor.coach_id)
        c = self.db.get(TennisClass, term.class_id)
        self._generate_sessions(actor, term, c, sched)
        self.db.commit()
        return self.to_out(actor, term)

    # ------------------------------------------------------------------ updates
    def update(self, actor: Actor, term_id: uuid.UUID, data: TermUpdate) -> dict:
        term = self.repo.get_owned(Term, term_id, actor.coach_id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(term, k, v)
        term.version += 1
        self.db.commit()
        return self.to_out(actor, term)

    def update_share(self, actor: Actor, term_id: uuid.UUID, student_id: uuid.UUID, share: int) -> dict:
        """Manually change one student's share (e.g. semi-private custom split)."""
        term = self.repo.get_owned(Term, term_id, actor.coach_id)
        m = next((m for m in term.members if m.student_id == student_id), None)
        if not m:
            raise ValidationError("Student is not in this term", code="not_member")
        m.share_per_session, m.share_overridden = share, True
        self._recompute_total(term)
        # regenerate non-paid automatic term charges for that student
        from app.infrastructure.db.models import Charge
        from app.domain.enums import ChargeKind
        for ch in self.db.scalars(select(Charge).where(
                Charge.term_id == term.id, Charge.student_id == student_id, Charge.is_void.is_(False),
                Charge.kind.in_([ChargeKind.TERM_FEE, ChargeKind.INSTALLMENT]))):
            ch.is_void = True
        self.db.flush()
        self.finance.generate_term_charges(term, self.db.get(TennisClass, term.class_id), [m])
        self.db.flush()
        self.finance.recalc(self.db.get(Student, student_id), actor.today())
        self.db.commit()
        return self.to_out(actor, term)

    def delete(self, actor: Actor, term_id: uuid.UUID) -> None:
        term = self.repo.get_owned(Term, term_id, actor.coach_id)
        now = utcnow()
        term.deleted_at = now
        term.status = TermStatus.CANCELLED
        for s in self.db.scalars(select(TrainingSession).where(
                TrainingSession.term_id == term.id, TrainingSession.status == SessionStatus.SCHEDULED)):
            s.deleted_at = now
        from app.infrastructure.db.models import Charge
        for ch in self.db.scalars(select(Charge).where(Charge.term_id == term.id)):
            ch.is_void = True
        self.db.flush()
        self.finance.recalc_many([m.student_id for m in term.members], actor.today())
        self.db.commit()
