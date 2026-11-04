import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.application.schemas.sessions import AttendanceBulkIn, AttendanceIn, AttendanceItem
from app.application.services.finance_service import FinanceService
from app.application.services.session_service import SessionService
from app.core.exceptions import ValidationError
from app.domain.attendance_rules import is_chargeable
from app.domain.enums import AttendanceStatus, MakeupStatus, SessionStatus, TermType
from app.infrastructure.db.models import (
    Attendance, MakeupSession, Student, TennisClass, Term, TrainingSession,
)
from app.infrastructure.db.types import utcnow
from app.infrastructure.repositories.base import Repository

ABSENT_STATES = {AttendanceStatus.ABSENT, AttendanceStatus.EXCUSED, AttendanceStatus.UNEXCUSED}


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = Repository(db)
        self.finance = FinanceService(db)
        self.sessions = SessionService(db)

    def _apply(self, actor: Actor, s: TrainingSession, term: Term | None, allowed: set, item: AttendanceItem,
               client_mutation_id: str | None = None) -> Attendance:
        if item.student_id not in allowed:
            raise ValidationError("Student is not part of this session", code="not_participant")
        if client_mutation_id:
            dup = self.db.scalar(select(Attendance).where(Attendance.client_mutation_id == client_mutation_id))
            if dup:
                return dup
        status = item.status
        if s.is_makeup and status == AttendanceStatus.PRESENT:
            status = AttendanceStatus.MAKEUP
        rules = (actor.coach.settings or {}).get("charge_rules")
        chargeable = is_chargeable(status, rules, item.is_chargeable)
        a = self.db.scalar(select(Attendance).where(Attendance.session_id == s.id,
                                                    Attendance.student_id == item.student_id))
        if a is None:
            a = Attendance(session_id=s.id, student_id=item.student_id)
            self.db.add(a)
        else:
            a.version += 1
        a.status = status
        a.absence_reason = item.absence_reason if status in ABSENT_STATES else None
        a.note = item.note
        a.is_chargeable = chargeable
        a.charge_overridden = item.is_chargeable is not None
        a.recorded_by_user_id = actor.user.id
        a.recorded_at = utcnow()
        if client_mutation_id:
            a.client_mutation_id = client_mutation_id
        self.db.flush()
        self.finance.sync_session_charge(s, term, item.student_id, chargeable, s.start_at.astimezone(actor.tz).date())
        # Not-consumed absence in a fixed-size term -> suggest a makeup session for the student
        pending = self.db.scalar(select(MakeupSession).where(
            MakeupSession.original_session_id == s.id, MakeupSession.student_id == item.student_id))
        if status in ABSENT_STATES and not chargeable and term and term.term_type != TermType.MONTHLY:
            if not pending:
                self.db.add(MakeupSession(coach_id=actor.coach_id, original_session_id=s.id, term_id=term.id,
                                          student_id=item.student_id, status=MakeupStatus.PENDING,
                                          reason=item.absence_reason.value if item.absence_reason else status.value))
        elif pending and pending.status == MakeupStatus.PENDING:
            pending.status = MakeupStatus.DISMISSED
        return a

    def record(self, actor: Actor, data: AttendanceIn) -> dict:
        s = self.repo.get_owned(TrainingSession, data.session_id, actor.coach_id)
        if s.status == SessionStatus.CANCELLED:
            raise ValidationError("Session is cancelled", code="session_cancelled")
        term = self.db.get(Term, s.term_id) if s.term_id else None
        allowed = {st.id for st in self.sessions.participants(s)}
        a = self._apply(actor, s, term, allowed, AttendanceItem(**data.model_dump(exclude={"session_id", "client_mutation_id"})),
                        data.client_mutation_id)
        self.db.flush()
        self.finance.recalc(self.db.get(Student, data.student_id), actor.today())
        self.db.commit()
        return self.to_out(a)

    def bulk(self, actor: Actor, data: AttendanceBulkIn) -> dict:
        s = self.repo.get_owned(TrainingSession, data.session_id, actor.coach_id)
        if s.status == SessionStatus.CANCELLED:
            raise ValidationError("Session is cancelled", code="session_cancelled")
        term = self.db.get(Term, s.term_id) if s.term_id else None
        allowed = {st.id for st in self.sessions.participants(s)}
        out = [self._apply(actor, s, term, allowed, item) for item in data.records]
        if data.complete_session:
            s.status = SessionStatus.COMPLETED
            s.version += 1
        self.db.flush()
        self.finance.recalc_many([r.student_id for r in data.records], actor.today())
        self.db.commit()
        return {"session_id": s.id, "status": s.status.value, "records": [self.to_out(a) for a in out]}

    def to_out(self, a: Attendance) -> dict:
        s = self.db.get(TrainingSession, a.session_id)
        st = self.db.get(Student, a.student_id)
        return {
            "id": a.id, "session_id": a.session_id, "student_id": a.student_id, "status": a.status,
            "absence_reason": a.absence_reason, "note": a.note, "is_chargeable": a.is_chargeable,
            "charge_overridden": a.charge_overridden, "recorded_at": a.recorded_at,
            "student_name": st.full_name if st else None, "session_start_at": s.start_at if s else None,
            "class_name": self.db.get(TennisClass, s.class_id).name if s else None,
        }

    def list(self, actor: Actor, session_id=None, student_id=None, limit=200) -> list[dict]:
        stmt = (select(Attendance).join(TrainingSession, TrainingSession.id == Attendance.session_id)
                .where(Attendance.deleted_at.is_(None), TrainingSession.deleted_at.is_(None)))
        if actor.coach:
            stmt = stmt.where(TrainingSession.coach_id == actor.coach_id)
        else:
            stmt = stmt.where(Attendance.student_id.in_(actor.student_ids or [uuid.uuid4()]))
        if session_id:
            stmt = stmt.where(Attendance.session_id == session_id)
        if student_id:
            stmt = stmt.where(Attendance.student_id == student_id)
        return [self.to_out(a) for a in self.db.scalars(stmt.order_by(TrainingSession.start_at.desc()).limit(limit))]
