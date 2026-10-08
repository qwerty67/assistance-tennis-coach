from __future__ import annotations
import uuid
from collections import Counter

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.application.context import Actor
from app.application.schemas.students import StudentCreate, StudentUpdate
from app.application.services.finance_service import FinanceService
from app.application.services.usage import remaining_sessions, upcoming_sessions, used_sessions
from app.core.exceptions import ConflictError
from app.domain.enums import StudentStatus, UserRole
from app.infrastructure.db.models import (
    Attendance, ClassMember, FinancialAccount, Student, TennisClass, Term, TermMember, TrainingPlan,
    TrainingSession, User,
)
from app.infrastructure.db.types import utcnow
from app.infrastructure.repositories.base import Repository


class StudentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = Repository(db)

    def _to_out(self, s: Student) -> dict:
        d = {c: getattr(s, c) for c in (
            "id", "first_name", "last_name", "age", "birth_date", "phone", "email", "level", "start_date",
            "strengths", "weaknesses", "goals", "coach_notes", "status", "created_at", "updated_at")}
        d["has_account"] = s.user_id is not None
        a = s.account
        d["account"] = {"total_charged": a.total_charged, "total_paid": a.total_paid, "balance": a.balance,
                        "overdue_amount": a.overdue_amount, "status": a.status} if a else None
        return d

    def list(self, actor: Actor, q: str | None = None, status: StudentStatus | None = None,
             level: str | None = None, financial_status: str | None = None) -> list[dict]:
        stmt = (select(Student).options(selectinload(Student.account))
                .where(Student.coach_id == actor.coach_id, Student.deleted_at.is_(None)))
        if q:
            like = f"%{q.strip()}%"
            stmt = stmt.where(or_(Student.first_name.ilike(like), Student.last_name.ilike(like),
                                  Student.phone.ilike(like), Student.email.ilike(like)))
        if status:
            stmt = stmt.where(Student.status == status)
        if level:
            stmt = stmt.where(Student.level == level)
        if financial_status:
            stmt = stmt.join(FinancialAccount, FinancialAccount.student_id == Student.id).where(
                FinancialAccount.status == financial_status)
        return [self._to_out(s) for s in self.db.scalars(stmt.order_by(Student.first_name, Student.last_name))]

    def _link_user(self, s: Student) -> None:
        if s.user_id or not (s.email or s.phone):
            return
        conds = [c for c in (User.email == s.email if s.email else None, User.phone == s.phone if s.phone else None) if c is not None]
        u = self.db.scalar(select(User).where(User.role == UserRole.STUDENT, or_(*conds)))
        if u:
            s.user_id = u.id

    def create(self, actor: Actor, data: StudentCreate) -> dict:
        if data.phone and self.db.scalar(select(Student.id).where(
                Student.coach_id == actor.coach_id, Student.phone == data.phone, Student.deleted_at.is_(None))):
            raise ConflictError("A student with this phone already exists", code="student_exists")
        payload = data.model_dump(exclude={"id"})
        if payload.get("email"):
            payload["email"] = payload["email"].lower()
        s = Student(id=data.id or uuid.uuid4(), coach_id=actor.coach_id, start_date=data.start_date or actor.today(),
                    **{k: v for k, v in payload.items() if k != "start_date"})
        self._link_user(s)
        self.db.add(s)
        self.db.flush()
        self.db.add(FinancialAccount(student_id=s.id, coach_id=actor.coach_id))
        self.db.commit()
        self.db.refresh(s)
        return self._to_out(s)

    def update(self, actor: Actor, student_id: uuid.UUID, data: StudentUpdate) -> dict:
        s = self.repo.get_owned(Student, student_id, actor.coach_id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(s, k, v)
        s.version += 1
        self._link_user(s)
        self.db.commit()
        return self._to_out(s)

    def set_status(self, actor: Actor, student_id: uuid.UUID, status: StudentStatus) -> dict:
        s = self.repo.get_owned(Student, student_id, actor.coach_id)
        s.status = status
        s.version += 1
        self.db.commit()
        return self._to_out(s)

    def delete(self, actor: Actor, student_id: uuid.UUID) -> None:
        """Soft delete keeps the financial history intact."""
        s = self.repo.get_owned(Student, student_id, actor.coach_id)
        s.deleted_at = utcnow()
        s.status = StudentStatus.INACTIVE
        s.version += 1
        for m in self.db.scalars(select(ClassMember).where(ClassMember.student_id == s.id)):
            m.is_active = False
        self.db.commit()

    def term_usages(self, s: Student) -> list[dict]:
        rows = self.db.execute(
            select(Term, TennisClass).join(TermMember, TermMember.term_id == Term.id)
            .join(TennisClass, TennisClass.id == Term.class_id)
            .where(TermMember.student_id == s.id, Term.deleted_at.is_(None))
            .order_by(Term.start_date.desc())
        ).all()
        return [{
            "term_id": t.id, "term_title": t.title, "class_id": c.id, "class_name": c.name,
            "class_type": c.class_type.value, "total_sessions": t.total_sessions,
            "used_sessions": used_sessions(self.db, t.id, s.id),
            "remaining_sessions": remaining_sessions(self.db, t, s.id),
            "upcoming_sessions": upcoming_sessions(self.db, t.id), "status": t.status.value,
        } for t, c in rows]

    def detail(self, actor: Actor, student_id: uuid.UUID, student: Student | None = None) -> dict:
        s = student or self.repo.get_owned(Student, student_id, actor.coach_id)
        out = self._to_out(s)
        out["terms"] = self.term_usages(s)
        out["classes"] = [
            {"id": str(c.id), "name": c.name, "class_type": c.class_type.value, "color": c.color}
            for c in self.db.scalars(select(TennisClass).join(ClassMember, ClassMember.class_id == TennisClass.id)
                                     .where(ClassMember.student_id == s.id, ClassMember.is_active.is_(True),
                                            TennisClass.deleted_at.is_(None)))
        ]
        att_rows = self.db.execute(
            select(Attendance, TrainingSession.start_at, TennisClass.name)
            .join(TrainingSession, TrainingSession.id == Attendance.session_id)
            .join(TennisClass, TennisClass.id == TrainingSession.class_id)
            .where(Attendance.student_id == s.id, Attendance.deleted_at.is_(None))
            .order_by(TrainingSession.start_at.desc())
        ).all()
        out["attendance_stats"] = dict(Counter(a.status.value for a, _, _ in att_rows))
        out["recent_attendance"] = [
            {"id": str(a.id), "session_id": str(a.session_id), "status": a.status.value,
             "absence_reason": a.absence_reason.value if a.absence_reason else None, "note": a.note,
             "is_chargeable": a.is_chargeable, "start_at": st.isoformat(), "class_name": cn}
            for a, st, cn in att_rows[:30]
        ]
        out["recent_payments"] = FinanceService(self.db).list_payments(actor, student_id=s.id, limit=20) if actor.coach else []
        out["training_plans"] = [
            {"id": str(p.id), "title": p.title, "status": p.status.value,
             "start_date": p.start_date.isoformat() if p.start_date else None,
             "end_date": p.end_date.isoformat() if p.end_date else None}
            for p in self.db.scalars(select(TrainingPlan).where(TrainingPlan.student_id == s.id,
                                                                TrainingPlan.deleted_at.is_(None)))
        ]
        return out

    def count(self, actor: Actor) -> dict:
        rows = self.db.execute(select(Student.status, func.count()).where(
            Student.coach_id == actor.coach_id, Student.deleted_at.is_(None)).group_by(Student.status)).all()
        d = {str(k): v for k, v in rows}
        return {"total": sum(d.values()), "active": d.get("active", 0), "inactive": d.get("inactive", 0)}
