"""Session usage queries shared by several services (used / remaining sessions)."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.enums import SessionStatus
from app.infrastructure.db.models import Attendance, Term, TrainingSession


def used_sessions(db: Session, term_id: uuid.UUID, student_id: uuid.UUID) -> int:
    return db.scalar(
        select(func.count(Attendance.id))
        .join(TrainingSession, TrainingSession.id == Attendance.session_id)
        .where(
            TrainingSession.term_id == term_id,
            TrainingSession.deleted_at.is_(None),
            Attendance.student_id == student_id,
            Attendance.is_chargeable.is_(True),
            Attendance.deleted_at.is_(None),
        )
    ) or 0


def upcoming_sessions(db: Session, term_id: uuid.UUID) -> int:
    return db.scalar(
        select(func.count(TrainingSession.id)).where(
            TrainingSession.term_id == term_id,
            TrainingSession.deleted_at.is_(None),
            TrainingSession.status == SessionStatus.SCHEDULED,
            TrainingSession.start_at >= datetime.now(timezone.utc),
        )
    ) or 0


def remaining_sessions(db: Session, term: Term, student_id: uuid.UUID) -> int | None:
    if not term.total_sessions:
        return None
    return max(0, term.total_sessions - used_sessions(db, term.id, student_id))


def session_counts(db: Session, term_id: uuid.UUID) -> dict[str, int]:
    rows = db.execute(
        select(TrainingSession.status, func.count(TrainingSession.id))
        .where(TrainingSession.term_id == term_id, TrainingSession.deleted_at.is_(None))
        .group_by(TrainingSession.status)
    ).all()
    out = {s.value: 0 for s in SessionStatus}
    for status, c in rows:
        out[str(status)] = c
    return out
