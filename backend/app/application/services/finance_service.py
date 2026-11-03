"""Tuition, charges, payments, balances and financial reports."""
import logging
import uuid
from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.application.schemas.finance import ChargeCreate, PaymentCreate
from app.core.exceptions import NotFoundError, ValidationError
from app.domain import jalali
from app.domain.enums import BillingMode, ChargeKind, NotificationType, PaymentPlan, RelationshipStatus, StudentStatus, TermType
from app.domain.finance import ChargeLine, account_snapshot
from app.domain.pricing import PriceBreakdown, split_amount
from app.infrastructure.db.models import (
    Attendance, Charge, ClassMember, Coach, CoachStudentRelationship, FinancialAccount, Payment, Student, TennisClass, Term, TermMember, TrainingSession,
)
from app.infrastructure.repositories.base import Repository
from app.application.services.notification_service import NotificationService

log = logging.getLogger("finance")


def fmt_money(v: int) -> str:
    return f"{v:,}"


class FinanceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = Repository(db)

    # ------------------------------------------------------------------ accounts
    def _charges(self, student_id: uuid.UUID) -> list[Charge]:
        return list(self.db.scalars(
            select(Charge).where(Charge.student_id == student_id, Charge.is_void.is_(False), Charge.deleted_at.is_(None))
        ))

    def _paid_total(self, student_id: uuid.UUID) -> int:
        return self.db.scalar(
            select(func.coalesce(func.sum(Payment.amount), 0))
            .where(Payment.student_id == student_id, Payment.is_void.is_(False), Payment.deleted_at.is_(None))
        ) or 0

    def snapshot(self, student: Student, today: date):
        charges = self._charges(student.id)
        lines = [ChargeLine(c.id, c.amount, c.due_date) for c in charges]
        snap = account_snapshot(lines, self._paid_total(student.id), today)
        by_id = {c.id: c for c in charges}
        return snap, by_id

    def recalc(self, student: Student, today: date) -> FinancialAccount:
        snap, _ = self.snapshot(student, today)
        acc = self.db.scalar(select(FinancialAccount).where(FinancialAccount.student_id == student.id))
        if acc is None:
            acc = FinancialAccount(student_id=student.id, coach_id=student.coach_id)
            self.db.add(acc)
        acc.total_charged = snap.total_charged
        acc.total_paid = snap.total_paid
        acc.balance = snap.balance
        acc.overdue_amount = snap.overdue_amount
        acc.status = snap.status.value
        return acc

    def recalc_many(self, student_ids, today: date) -> None:
        for sid in set(student_ids):
            s = self.db.get(Student, sid)
            if s:
                self.recalc(s, today)

    def charges_with_status(self, student: Student, today: date) -> list[dict]:
        snap, by_id = self.snapshot(student, today)
        cids = [c.class_id for c in by_id.values() if c.class_id]
        classes = {c.id: c.name for c in self.db.scalars(
            select(TennisClass).where(TennisClass.id.in_(cids))
        )} if cids else {}
        out = []
        for line in snap.lines:
            c = by_id[line.id]
            cd = _charge_dict(c)
            cd["class_name"] = classes.get(c.class_id)
            out.append({**cd, "paid": line.paid, "remaining": line.remaining,
                        "status": line.status.value, "student_name": student.full_name})
        return out

    def student_debts_by_class(self, student: Student, today: date) -> list[dict]:
        """Itemizes student's charges and unpaid debts per class (FIFO-consistent)."""
        snap, by_id = self.snapshot(student, today)
        class_stats = defaultdict(lambda: {"charged": 0, "paid": 0, "debt": 0})
        for line in snap.lines:
            c = by_id[line.id]
            class_stats[c.class_id]["charged"] += c.amount
            class_stats[c.class_id]["paid"] += line.paid
            class_stats[c.class_id]["debt"] += line.remaining

        # Also include all classes where student is an active member or term member
        enrolled_class_ids = set(self.db.scalars(
            select(ClassMember.class_id).where(ClassMember.student_id == student.id, ClassMember.is_active.is_(True))
        ).all())
        term_class_ids = set(self.db.scalars(
            select(Term.class_id).join(TermMember, TermMember.term_id == Term.id)
            .where(TermMember.student_id == student.id, Term.deleted_at.is_(None))
        ).all())
        all_class_ids = set(class_stats.keys()) | enrolled_class_ids | term_class_ids

        cids = [cid for cid in all_class_ids if cid is not None]
        classes = {c.id: c for c in self.db.scalars(
            select(TennisClass).where(TennisClass.id.in_(cids), TennisClass.deleted_at.is_(None))
        )} if cids else {}

        res = []
        for cid in all_class_ids:
            stats = class_stats[cid]
            cls = classes.get(cid)
            if cid is None and stats["charged"] == 0 and stats["debt"] == 0:
                continue
            if cid is not None and not cls and stats["charged"] == 0:
                continue
            res.append({
                "class_id": cid,
                "class_name": cls.name if cls else "جلسات آزاد / بدون کلاس",
                "class_type": cls.class_type.value if cls else None,
                "color": cls.color if cls else None,
                "charged": stats["charged"],
                "paid": stats["paid"],
                "debt": stats["debt"],
            })
        return sorted(res, key=lambda x: (-x["debt"], x["class_name"]))

    def account_detail(self, actor: Actor, student_id: uuid.UUID) -> dict:
        from app.application.services.usage import used_sessions

        student = self._get_accessible_student(actor, student_id)
        today = actor.today()
        snap, _ = self.snapshot(student, today)
        terms = list(self.db.scalars(
            select(Term).join(TermMember, TermMember.term_id == Term.id)
            .where(TermMember.student_id == student.id, Term.deleted_at.is_(None), Term.status.in_(["active", "draft"]))
        ))
        total_sessions = sum(t.total_sessions or 0 for t in terms) or None
        used = sum(used_sessions(self.db, t.id, student.id) for t in terms)

        # Standalone (non-term) attended sessions
        standalone_used = self.db.scalar(
            select(func.count(Attendance.id))
            .join(TrainingSession, TrainingSession.id == Attendance.session_id)
            .where(
                TrainingSession.term_id.is_(None),
                TrainingSession.deleted_at.is_(None),
                Attendance.student_id == student.id,
                Attendance.is_chargeable.is_(True),
                Attendance.deleted_at.is_(None),
            )
        ) or 0
        used += standalone_used

        payments = self.list_payments(actor, student_id=student.id, limit=100)
        coach = self.db.get(Coach, student.coach_id)
        coach_name = coach.user.full_name if (coach and coach.user) else None

        return {
            "student_id": student.id,
            "student_name": student.full_name,
            "coach_id": student.coach_id,
            "coach_name": coach_name,
            "total_tuition": snap.total_charged,
            "paid_amount": snap.total_paid,
            "remaining_amount": snap.debt,
            "debt": snap.debt,
            "credit": snap.credit,
            "overdue_amount": snap.overdue_amount,
            "status": snap.status.value,
            "number_of_sessions": total_sessions,
            "used_sessions": used,
            "remaining_sessions": max(0, total_sessions - used) if total_sessions else None,
            "debts_by_class": self.student_debts_by_class(student, today),
            "charges": self.charges_with_status(student, today),
            "payments": payments,
        }

    def _get_accessible_student(self, actor: Actor, student_id: uuid.UUID) -> Student:
        if not actor.coach:
            return self._student_for(actor, student_id)
        s = self.db.get(Student, student_id)
        if not s or s.deleted_at:
            raise NotFoundError("Student not found")
        if s.coach_id == actor.coach_id:
            return s
        has_rel = self.db.scalar(select(CoachStudentRelationship.id).where(
            CoachStudentRelationship.coach_id == actor.coach_id,
            CoachStudentRelationship.student_id == s.id,
            CoachStudentRelationship.status == RelationshipStatus.ACTIVE,
        ))
        if not has_rel:
            raise NotFoundError("Student not found")
        return s

    def _student_for(self, actor: Actor, student_id: uuid.UUID) -> Student:
        if student_id not in actor.student_ids:
            raise NotFoundError("Student not found")
        return self.db.get(Student, student_id)

    # ------------------------------------------------------------------ charges
    def add_charge(self, *, coach_id, student_id, kind: ChargeKind, amount: int, court_cost: int = 0,
                   term_id=None, class_id=None, session_id=None, due_date=None, period=None,
                   installment_no=None, description=None) -> Charge:
        court_cost = min(court_cost, amount)
        c = Charge(
            coach_id=coach_id, student_id=student_id, kind=kind, amount=amount,
            court_cost_amount=court_cost, coach_income_amount=amount - court_cost,
            term_id=term_id, class_id=class_id, session_id=session_id, due_date=due_date,
            period=period, installment_no=installment_no, description=description,
        )
        self.db.add(c)
        return c

    def create_manual_charge(self, actor: Actor, data: ChargeCreate) -> Charge:
        student = self._get_accessible_student(actor, data.student_id)
        if data.class_id:
            self.repo.get_owned(TennisClass, data.class_id, actor.coach_id)
        if data.term_id:
            self.repo.get_owned(Term, data.term_id, actor.coach_id)
        c = self.add_charge(
            coach_id=actor.coach_id, student_id=student.id, kind=data.kind, amount=data.amount,
            court_cost=data.court_cost_amount, term_id=data.term_id, class_id=data.class_id,
            due_date=data.due_date or actor.today(), description=data.description,
        )
        self.db.flush()
        self.recalc(student, actor.today())
        try:
            NotificationService(self.db).notify_students(
                [student], NotificationType.PAYMENT_DUE, "صورتحساب شهریه جدید",
                f"صورتحساب جدید به مبلغ {fmt_money(c.amount)} تومان برای «{c.description or 'شهریه'}» ثبت شد.",
                {"charge_id": str(c.id), "amount": c.amount},
            )
        except Exception:
            pass
        self.db.commit()
        return c

    def void_charge(self, actor: Actor, charge_id: uuid.UUID) -> None:
        c = self.repo.get_owned(Charge, charge_id, actor.coach_id)
        c.is_void = True
        c.version += 1
        self.db.flush()
        self.recalc(self.db.get(Student, c.student_id), actor.today())
        self.db.commit()

    def list_charges(self, actor: Actor, student_id=None, status=None) -> list[dict]:
        today = actor.today()
        stmt = select(Student).where(Student.coach_id == actor.coach_id, Student.deleted_at.is_(None))
        if student_id:
            stmt = stmt.where(Student.id == student_id)
        out = []
        for s in self.db.scalars(stmt):
            out.extend(self.charges_with_status(s, today))
        if status:
            out = [c for c in out if c["status"] == status]
        return sorted(out, key=lambda c: (c["due_date"] or date.max), reverse=True)

    # term level charge generation ------------------------------------------------
    def generate_term_charges(self, term: Term, tclass: TennisClass, members: list[TermMember]) -> None:
        """Create receivables when a term is created, according to its payment plan."""
        if term.payment_plan in (PaymentPlan.PER_SESSION, PaymentPlan.MANUAL):
            return
        breakdown = PriceBreakdown(term.session_price, term.court_cost, term.coach_income)
        for m in members:
            if m.share_per_session <= 0:
                continue
            if term.term_type == TermType.MONTHLY:
                jy, jm, _ = jalali.to_jalali(term.start_date)
                self._monthly_charge(term, tclass, m, f"{jy:04d}-{jm:02d}", term.start_date)
                continue
            total = m.share_per_session * (term.total_sessions or 0)
            court = breakdown.scale(m.share_per_session).court_cost * (term.total_sessions or 0)
            if term.payment_plan == PaymentPlan.UPFRONT or term.installments_count <= 1:
                self.add_charge(coach_id=term.coach_id, student_id=m.student_id, kind=ChargeKind.TERM_FEE,
                                amount=total, court_cost=court, term_id=term.id, class_id=tclass.id,
                                due_date=term.start_date, description=term.title)
            else:
                n = term.installments_count
                span = ((term.end_date - term.start_date).days if term.end_date else 30 * n)
                step = max(1, span // n)
                courts = split_amount(court, n)
                for i, amt in enumerate(split_amount(total, n)):
                    self.add_charge(coach_id=term.coach_id, student_id=m.student_id, kind=ChargeKind.INSTALLMENT,
                                    amount=amt, court_cost=courts[i], term_id=term.id, class_id=tclass.id,
                                    due_date=term.start_date + timedelta(days=i * step), installment_no=i + 1,
                                    description=f"{term.title} ({i + 1}/{n})")

    def _monthly_charge(self, term: Term, tclass: TennisClass, m: TermMember, period: str, due: date) -> Charge | None:
        exists = self.db.scalar(select(Charge.id).where(
            Charge.term_id == term.id, Charge.student_id == m.student_id, Charge.period == period,
            Charge.kind == ChargeKind.MONTHLY_FEE, Charge.is_void.is_(False)))
        if exists:
            return None
        court = 0
        if term.session_price:
            court = PriceBreakdown(term.session_price, term.court_cost, term.coach_income).scale(m.share_per_session).court_cost
        return self.add_charge(coach_id=term.coach_id, student_id=m.student_id, kind=ChargeKind.MONTHLY_FEE,
                               amount=m.share_per_session, court_cost=court, term_id=term.id, class_id=tclass.id,
                               due_date=due, period=period, description=f"{term.title} - {period}")

    def generate_monthly(self, actor: Actor, term_id: uuid.UUID, period: str, due: date | None) -> int:
        term = self.repo.get_owned(Term, term_id, actor.coach_id)
        if term.term_type != TermType.MONTHLY:
            raise ValidationError("Term is not monthly", code="not_monthly")
        jy, jm = map(int, period.split("-"))
        due = due or jalali.to_gregorian(jy, jm, 1)
        tclass = self.db.get(TennisClass, term.class_id)
        created = 0
        for m in term.members:
            if self._monthly_charge(term, tclass, m, period, due):
                created += 1
        self.db.flush()
        self.recalc_many([m.student_id for m in term.members], actor.today())
        self.db.commit()
        return created

    # per-session attendance charge sync -----------------------------------------
    def sync_session_charge(self, session: TrainingSession, term: Term | None, student_id: uuid.UUID,
                            chargeable: bool, local_date: date) -> None:
        """Create or void a session charge based on attendance + term payment plan + standalone class logic.

        Business Rule:
        1. If session belongs to a Term:
           - PER_SESSION: charged per session.
           - UPFRONT / INSTALLMENT / MONTHLY: covered by term upfront/installment/monthly charges,
             no extra session_fee charge generated unless session is extra/standalone.
        2. If session does NOT belong to a Term (Standalone session / Free class session):
           - Charged using the class's session_price (split among active members if group),
             or session's own session_price.
        """
        if term and term.payment_plan != PaymentPlan.PER_SESSION:
            return

        existing = self.db.scalar(select(Charge).where(
            Charge.session_id == session.id, Charge.student_id == student_id,
            Charge.kind == ChargeKind.SESSION_FEE))

        tclass = self.db.get(TennisClass, session.class_id) if session.class_id else None

        share = 0
        if term and term.payment_plan == PaymentPlan.PER_SESSION:
            m = self.db.scalar(select(TermMember).where(TermMember.term_id == term.id, TermMember.student_id == student_id))
            share = m.share_per_session if m else 0
        else:
            base_price = session.session_price or (tclass.session_price if tclass else 0)
            billing = tclass.billing_mode if tclass else BillingMode.PER_STUDENT
            if billing == BillingMode.SPLIT:
                from app.infrastructure.db.models import Attendance
                part_count = self.db.scalar(select(func.count(Attendance.id)).where(Attendance.session_id == session.id)) or 1
                share = max(0, base_price // max(1, part_count))
            else:
                share = base_price

        if chargeable and share > 0:
            court = PriceBreakdown(session.session_price, session.court_cost, session.coach_income).scale(share).court_cost \
                if session.session_price else 0
            desc = f"{term.title} #{session.sequence_number or ''}".strip() if term else (
                f"{tclass.name} (جلسه آزاد)" if tclass else "جلسه تمرینی آزاد"
            )
            if existing:
                existing.is_void = False
                existing.amount = share
                existing.court_cost_amount, existing.coach_income_amount = court, share - court
                existing.description = desc
            else:
                self.add_charge(coach_id=session.coach_id, student_id=student_id, kind=ChargeKind.SESSION_FEE,
                                amount=share, court_cost=court, term_id=term.id if term else None, class_id=session.class_id,
                                session_id=session.id, due_date=local_date, description=desc)
        elif existing and not existing.is_void:
            existing.is_void = True

    # ------------------------------------------------------------------ payments
    def record_payment(self, actor: Actor, data: PaymentCreate) -> Payment:
        student = self._get_accessible_student(actor, data.student_id)
        term = None
        if data.term_id:
            term = self.repo.get_owned(Term, data.term_id, actor.coach_id)
        cid = data.class_id or (term.class_id if term else None)
        if cid:
            self.repo.get_owned(TennisClass, cid, actor.coach_id)

        if data.id and self.db.get(Payment, data.id):
            p = self.db.get(Payment, data.id)
            p.student_name = student.full_name
            return p

        p = Payment(
            id=data.id or uuid.uuid4(), coach_id=actor.coach_id, student_id=student.id, amount=data.amount,
            paid_at=data.paid_at, method=data.method, description=data.description, term_id=data.term_id,
            class_id=cid, reference_no=data.reference_no, recorded_by_user_id=actor.user.id,
        )
        self.db.add(p)
        self.db.flush()
        acc = self.recalc(student, actor.today())
        try:
            NotificationService(self.db).notify_students(
                [student], NotificationType.PAYMENT_RECORDED, "پرداخت ثبت شد",
                f"مبلغ {fmt_money(data.amount)} تومان ثبت شد. مانده حساب: {fmt_money(acc.balance)}",
                {"payment_id": str(p.id), "amount": data.amount, "balance": acc.balance},
            )
        except Exception as e:
            log.warning("Failed to dispatch payment notification: %s", e)
        self.db.commit()
        p.student_name = student.full_name
        return p

    def void_payment(self, actor: Actor, payment_id: uuid.UUID) -> None:
        p = self.repo.get_owned(Payment, payment_id, actor.coach_id)
        p.is_void = True
        p.version += 1
        self.db.flush()
        self.recalc(self.db.get(Student, p.student_id), actor.today())
        self.db.commit()

    def list_payments(self, actor: Actor, student_id=None, date_from=None, date_to=None, limit=200) -> list[dict]:
        stmt = (select(Payment, Student.first_name, Student.last_name, TennisClass.name.label("class_name"))
                .join(Student, Student.id == Payment.student_id)
                .outerjoin(TennisClass, TennisClass.id == Payment.class_id)
                .where(Payment.is_void.is_(False), Payment.deleted_at.is_(None)))
        if actor.coach:
            stmt = stmt.where(Payment.coach_id == actor.coach_id)
        else:
            stmt = stmt.where(Payment.student_id.in_(actor.student_ids or [uuid.uuid4()]))
        if student_id:
            stmt = stmt.where(Payment.student_id == student_id)
        if date_from:
            stmt = stmt.where(Payment.paid_at >= date_from)
        if date_to:
            stmt = stmt.where(Payment.paid_at <= date_to)
        rows = self.db.execute(stmt.order_by(Payment.paid_at.desc(), Payment.created_at.desc()).limit(limit)).all()
        return [{**_payment_dict(p), "student_name": f"{fn} {ln}", "class_name": class_name} for p, fn, ln, class_name in rows]

    # ------------------------------------------------------------------ reports
    def summary(self, actor: Actor, months: int = 6, date_from: date | None = None, date_to: date | None = None) -> dict:
        today = actor.today()
        cid = actor.coach_id
        jy, jm, _ = jalali.to_jalali(today)
        m_start, m_end = jalali.jalali_month_range(jy, jm)
        y_start = jalali.to_gregorian(jy, 1, 1)
        p_start = date_from or m_start
        p_end = date_to or (m_end - timedelta(days=1))
        payments = self.db.execute(
            select(Payment.amount, Payment.paid_at, Payment.method, Payment.student_id, Payment.class_id)
            .where(Payment.coach_id == cid, Payment.is_void.is_(False), Payment.deleted_at.is_(None))
        ).all()
        charges = self.db.execute(
            select(Charge.amount, Charge.due_date, Charge.court_cost_amount, Charge.coach_income_amount,
                   Charge.class_id, Charge.student_id, Charge.created_at)
            .where(Charge.coach_id == cid, Charge.is_void.is_(False), Charge.deleted_at.is_(None))
        ).all()

        def cdate(c):
            return c.due_date or c.created_at.date()

        in_period = lambda d: p_start <= d <= p_end  # noqa: E731
        received = sum(p.amount for p in payments if in_period(p.paid_at))
        p_charges = [c for c in charges if in_period(cdate(c))]

        # monthly series (Jalali months)
        series = []
        for i in range(months - 1, -1, -1):
            y, m = jalali.shift_month(jy, jm, -i)
            s, e = jalali.jalali_month_range(y, m)
            series.append({
                "key": f"{y:04d}-{m:02d}", "label_year": y, "label_month": m,
                "received": sum(p.amount for p in payments if s <= p.paid_at <= e),
                "charged": sum(c.amount for c in charges if s <= cdate(c) <= e),
                "coach_income": sum(c.coach_income_amount for c in charges if s <= cdate(c) <= e),
                "court_cost": sum(c.court_cost_amount for c in charges if s <= cdate(c) <= e),
            })

        accounts = list(self.db.scalars(
            select(FinancialAccount).where(FinancialAccount.coach_id == cid, FinancialAccount.status.in_(["debt", "overdue", "partial"]))
        ))
        students = {s.id: s for s in self.db.scalars(
            select(Student).where(Student.coach_id == cid, Student.status == StudentStatus.ACTIVE, Student.deleted_at.is_(None))
        )}

        # Breakdown by class
        by_class = defaultdict(lambda: {"charged": 0, "received": 0})
        for c in charges:
            if in_period(cdate(c)):
                by_class[c.class_id]["charged"] += c.amount
        for p in payments:
            if in_period(p.paid_at):
                by_class[p.class_id]["received"] += p.amount

        # Breakdown by class_type
        by_class_type = defaultdict(lambda: {"charged": 0, "received": 0})
        classes = {c.id: c for c in self.db.scalars(select(TennisClass).where(TennisClass.coach_id == cid))}
        for cid_key, v in by_class.items():
            ctype = classes[cid_key].class_type.value if cid_key in classes else "standalone"
            by_class_type[ctype]["charged"] += v["charged"]
            by_class_type[ctype]["received"] += v["received"]

        by_student = defaultdict(int)
        for p in payments:
            if in_period(p.paid_at):
                by_student[p.student_id] += p.amount

        by_method = defaultdict(int)
        for p in payments:
            if in_period(p.paid_at):
                by_method[p.method.value] += p.amount

        debtors = [a for a in accounts if a.balance < 0 and a.student_id in students]

        return {
            "period_start": p_start, "period_end": p_end, "received": received,
            "charged": sum(c.amount for c in p_charges),
            "coach_income": sum(c.coach_income_amount for c in p_charges),
            "court_cost": sum(c.court_cost_amount for c in p_charges),
            "outstanding": sum(-a.balance for a in accounts if a.balance < 0 and a.student_id in students),
            "total_credit": sum(a.balance for a in accounts if a.balance > 0 and a.student_id in students),
            "debtors_count": len(debtors),
            "month_income": sum(p.amount for p in payments if m_start <= p.paid_at <= m_end),
            "year_income": sum(p.amount for p in payments if y_start <= p.paid_at <= today),
            "monthly": series,
            "by_class_type": [{"class_type": k, **v} for k, v in by_class_type.items()],
            "by_class": [{"class_id": k, "name": classes[k].name, "class_type": classes[k].class_type.value,
                          "color": classes[k].color, **v}
                         for k, v in by_class.items() if k in classes],
            "by_student": sorted([{"student_id": str(k), "name": students[k].full_name, "received": v}
                                  for k, v in by_student.items() if k in students],
                                 key=lambda x: -x["received"]),
            "by_method": [{"method": k, "amount": v} for k, v in by_method.items()],
            "debtors": [{"student_id": str(a.student_id), "name": students[a.student_id].full_name,
                         "debt": -a.balance, "overdue": a.overdue_amount, "status": a.status,
                         "debts_by_class": self.student_debts_by_class(students[a.student_id], today)} for a in debtors],
        }


def _charge_dict(c: Charge) -> dict:
    return {k: getattr(c, k) for k in (
        "id", "student_id", "term_id", "class_id", "session_id", "kind", "amount", "court_cost_amount",
        "coach_income_amount", "period", "installment_no", "due_date", "description", "is_void")}


def _payment_dict(p: Payment) -> dict:
    return {k: getattr(p, k) for k in (
        "id", "student_id", "amount", "paid_at", "method", "description", "term_id", "class_id",
        "reference_no", "is_void", "created_at")}
