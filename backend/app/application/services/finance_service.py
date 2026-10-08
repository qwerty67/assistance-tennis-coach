"""Tuition, charges, payments, balances and financial reports."""
import uuid
from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.application.schemas.finance import ChargeCreate, PaymentCreate
from app.core.exceptions import NotFoundError, ValidationError
from app.domain import jalali
from app.domain.enums import ChargeKind, NotificationType, PaymentPlan, TermType
from app.domain.finance import ChargeLine, account_snapshot
from app.domain.pricing import PriceBreakdown, split_amount
from app.infrastructure.db.models import (
    Charge, FinancialAccount, Payment, Student, TennisClass, Term, TermMember, TrainingSession,
)
from app.infrastructure.repositories.base import Repository
from app.application.services.notification_service import NotificationService


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
        out = []
        for line in snap.lines:
            c = by_id[line.id]
            out.append({**_charge_dict(c), "paid": line.paid, "remaining": line.remaining,
                        "status": line.status.value, "student_name": student.full_name})
        return out

    def account_detail(self, actor: Actor, student_id: uuid.UUID) -> dict:
        from app.application.services.usage import used_sessions

        student = self.repo.get_owned(Student, student_id, actor.coach_id) if actor.coach else self._student_for(actor, student_id)
        today = actor.today()
        snap, _ = self.snapshot(student, today)
        terms = list(self.db.scalars(
            select(Term).join(TermMember, TermMember.term_id == Term.id)
            .where(TermMember.student_id == student.id, Term.deleted_at.is_(None), Term.status.in_(["active", "draft"]))
        ))
        total_sessions = sum(t.total_sessions or 0 for t in terms) or None
        used = sum(used_sessions(self.db, t.id, student.id) for t in terms)
        payments = self.list_payments(actor, student_id=student.id, limit=100)
        return {
            "student_id": student.id,
            "student_name": student.full_name,
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
            "charges": self.charges_with_status(student, today),
            "payments": payments,
        }

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
        student = self.repo.get_owned(Student, data.student_id, actor.coach_id)
        c = self.add_charge(
            coach_id=actor.coach_id, student_id=student.id, kind=data.kind, amount=data.amount,
            court_cost=data.court_cost_amount, term_id=data.term_id, class_id=data.class_id,
            due_date=data.due_date or actor.today(), description=data.description,
        )
        self.db.flush()
        self.recalc(student, actor.today())
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

    def sync_session_charge(self, session: TrainingSession, term: Term | None, student_id: uuid.UUID,
                            chargeable: bool, local_date: date) -> None:
        """For per-session plans: charge when chargeable, void when not."""
        if not term or term.payment_plan != PaymentPlan.PER_SESSION:
            return
        existing = self.db.scalar(select(Charge).where(Charge.session_id == session.id, Charge.student_id == student_id))
        member = self.db.scalar(select(TermMember).where(TermMember.term_id == term.id, TermMember.student_id == student_id))
        share = member.share_per_session if member else 0
        if chargeable and share > 0:
            court = PriceBreakdown(session.session_price, session.court_cost, session.coach_income).scale(share).court_cost \
                if session.session_price else 0
            if existing:
                existing.is_void = False
                existing.amount = share
                existing.court_cost_amount, existing.coach_income_amount = court, share - court
            else:
                self.add_charge(coach_id=session.coach_id, student_id=student_id, kind=ChargeKind.SESSION_FEE,
                                amount=share, court_cost=court, term_id=term.id, class_id=session.class_id,
                                session_id=session.id, due_date=local_date,
                                description=f"{term.title} #{session.sequence_number or ''}".strip())
        elif existing and not existing.is_void:
            existing.is_void = True

    # ------------------------------------------------------------------ payments
    def record_payment(self, actor: Actor, data: PaymentCreate) -> Payment:
        student = self.repo.get_owned(Student, data.student_id, actor.coach_id)
        if data.term_id:
            self.repo.get_owned(Term, data.term_id, actor.coach_id)
        if data.class_id:
            self.repo.get_owned(TennisClass, data.class_id, actor.coach_id)
        if data.id and self.db.get(Payment, data.id):
            return self.db.get(Payment, data.id)  # idempotent replay
        p = Payment(
            id=data.id or uuid.uuid4(), coach_id=actor.coach_id, student_id=student.id, amount=data.amount,
            paid_at=data.paid_at, method=data.method, description=data.description, term_id=data.term_id,
            class_id=data.class_id, reference_no=data.reference_no, recorded_by_user_id=actor.user.id,
        )
        self.db.add(p)
        self.db.flush()
        acc = self.recalc(student, actor.today())
        NotificationService(self.db).notify_students(
            [student], NotificationType.PAYMENT_RECORDED, "پرداخت ثبت شد",
            f"مبلغ {fmt_money(data.amount)} تومان ثبت شد. مانده حساب: {fmt_money(acc.balance)}",
            {"payment_id": str(p.id), "amount": data.amount, "balance": acc.balance},
        )
        self.db.commit()
        return p

    def void_payment(self, actor: Actor, payment_id: uuid.UUID) -> None:
        p = self.repo.get_owned(Payment, payment_id, actor.coach_id)
        p.is_void = True
        p.version += 1
        self.db.flush()
        self.recalc(self.db.get(Student, p.student_id), actor.today())
        self.db.commit()

    def list_payments(self, actor: Actor, student_id=None, date_from=None, date_to=None, limit=200) -> list[dict]:
        stmt = (select(Payment, Student.first_name, Student.last_name)
                .join(Student, Student.id == Payment.student_id)
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
        return [{**_payment_dict(p), "student_name": f"{fn} {ln}"} for p, fn, ln in rows]

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
                "received": sum(p.amount for p in payments if s <= p.paid_at < e),
                "charged": sum(c.amount for c in charges if s <= cdate(c) < e),
                "coach_income": sum(c.coach_income_amount for c in charges if s <= cdate(c) < e),
                "court_cost": sum(c.court_cost_amount for c in charges if s <= cdate(c) < e),
            })

        classes = {c.id: c for c in self.db.scalars(select(TennisClass).where(TennisClass.coach_id == cid))}
        students = {s.id: s for s in self.db.scalars(select(Student).where(Student.coach_id == cid))}

        by_type: dict[str, dict] = defaultdict(lambda: {"charged": 0, "received": 0})
        by_class: dict = defaultdict(lambda: {"charged": 0, "received": 0})
        for c in p_charges:
            t = classes[c.class_id].class_type.value if c.class_id in classes else "other"
            by_type[t]["charged"] += c.amount
            if c.class_id:
                by_class[c.class_id]["charged"] += c.amount
        by_student: dict = defaultdict(int)
        by_method: dict = defaultdict(int)
        for p in payments:
            if not in_period(p.paid_at):
                continue
            by_student[p.student_id] += p.amount
            by_method[p.method.value if hasattr(p.method, "value") else p.method] += p.amount
            if p.class_id:
                by_class[p.class_id]["received"] += p.amount
                by_type[classes[p.class_id].class_type.value]["received"] += p.amount

        accounts = list(self.db.scalars(select(FinancialAccount).where(FinancialAccount.coach_id == cid)))
        debtors = sorted([a for a in accounts if a.balance < 0 and a.student_id in students], key=lambda a: a.balance)
        return {
            "period_start": p_start, "period_end": p_end,
            "received": received,
            "charged": sum(c.amount for c in p_charges),
            "coach_income": sum(c.coach_income_amount for c in p_charges),
            "court_cost": sum(c.court_cost_amount for c in p_charges),
            "outstanding": -sum(a.balance for a in debtors),
            "total_credit": sum(a.balance for a in accounts if a.balance > 0),
            "debtors_count": len(debtors),
            "month_income": sum(p.amount for p in payments if m_start <= p.paid_at < m_end),
            "year_income": sum(p.amount for p in payments if y_start <= p.paid_at <= today),
            "monthly": series,
            "by_class_type": [{"class_type": k, **v} for k, v in by_type.items()],
            "by_class": [{"class_id": str(k), "name": classes[k].name, "class_type": classes[k].class_type.value, **v}
                         for k, v in by_class.items() if k in classes],
            "by_student": sorted([{"student_id": str(k), "name": students[k].full_name, "received": v}
                                  for k, v in by_student.items() if k in students],
                                 key=lambda x: -x["received"]),
            "by_method": [{"method": k, "amount": v} for k, v in by_method.items()],
            "debtors": [{"student_id": str(a.student_id), "name": students[a.student_id].full_name,
                         "debt": -a.balance, "overdue": a.overdue_amount, "status": a.status} for a in debtors],
        }


def _charge_dict(c: Charge) -> dict:
    return {k: getattr(c, k) for k in (
        "id", "student_id", "term_id", "class_id", "session_id", "kind", "amount", "court_cost_amount",
        "coach_income_amount", "period", "installment_no", "due_date", "description", "is_void")}


def _payment_dict(p: Payment) -> dict:
    return {k: getattr(p, k) for k in (
        "id", "student_id", "amount", "paid_at", "method", "description", "term_id", "class_id",
        "reference_no", "is_void", "created_at")}
