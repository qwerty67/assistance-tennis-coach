from __future__ import annotations
"""Calendar sessions: listing, details, add, reschedule, cancel, delete, makeups, history."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.application.schemas.sessions import CancelIn, MakeupCreate, SessionCreate, SessionUpdate
from app.application.services.finance_service import FinanceService
from app.application.services.notification_service import NotificationService
from app.application.services.usage import remaining_sessions
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.domain.enums import (
    AttendanceStatus, MakeupStatus, NotificationType, SessionChangeType, SessionStatus,
)
from app.infrastructure.db.models import (
    Attendance, ClassMember, MakeupSession, SessionChangeLog, Student, TennisClass, Term, TermMember,
    TrainingSession,
)
from app.infrastructure.db.types import utcnow
from app.infrastructure.repositories.base import Repository


class SessionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = Repository(db)
        self.finance = FinanceService(db)
        self.notifier = NotificationService(db)

    # ------------------------------------------------------------------ helpers
    def participants(self, s: TrainingSession) -> list[Student]:
        if s.term_id:
            ids = list(self.db.scalars(select(TermMember.student_id).where(TermMember.term_id == s.term_id)))
        else:
            ids = list(self.db.scalars(select(ClassMember.student_id).where(
                ClassMember.class_id == s.class_id, ClassMember.is_active.is_(True))))
        extra = self.db.scalars(select(Attendance.student_id).where(Attendance.session_id == s.id))
        ids = list(dict.fromkeys([*ids, *extra]))
        if not ids:
            return []
        return list(self.db.scalars(select(Student).where(Student.id.in_(ids), Student.deleted_at.is_(None))))

    def _log(self, actor: Actor, s: TrainingSession, ctype: SessionChangeType, old=(None, None), reason=None):
        self.db.add(SessionChangeLog(session_id=s.id, changed_by_user_id=actor.user.id, change_type=ctype,
                                     old_start_at=old[0], old_end_at=old[1], new_start_at=s.start_at,
                                     new_end_at=s.end_at, reason=reason))

    def _renumber(self, term_id: uuid.UUID | None) -> None:
        if not term_id:
            return
        sessions = self.db.scalars(select(TrainingSession).where(
            TrainingSession.term_id == term_id, TrainingSession.deleted_at.is_(None),
            TrainingSession.status != SessionStatus.CANCELLED).order_by(TrainingSession.start_at))
        for i, s in enumerate(sessions, start=1):
            s.sequence_number = i

    def _local(self, actor: Actor, dt: datetime) -> str:
        return dt.astimezone(actor.tz).strftime("%Y/%m/%d %H:%M")

    def to_out(self, s: TrainingSession, with_students=True) -> dict:
        c = s.tennis_class or self.db.get(TennisClass, s.class_id)
        d = {k: getattr(s, k) for k in (
            "id", "class_id", "term_id", "sequence_number", "start_at", "end_at", "status", "is_makeup",
            "makeup_for_id", "session_price", "court_cost", "coach_income", "location", "notes",
            "cancel_reason", "version")}
        d.update(class_name=c.name, class_type=c.class_type.value, color=c.color,
                 duration_minutes=int((s.end_at - s.start_at).total_seconds() // 60))
        if with_students:
            students = self.participants(s)
            d["student_names"] = [st.full_name for st in students]
            d["student_count"] = len(students)
            recorded = set(self.db.scalars(select(Attendance.student_id).where(Attendance.session_id == s.id)))
            d["attendance_done"] = bool(students) and all(st.id in recorded for st in students)
        return d

    # ------------------------------------------------------------------ queries
    def list(self, actor: Actor, date_from: datetime | None = None, date_to: datetime | None = None,
             class_id=None, student_id=None, status=None, include_cancelled=True) -> list[dict]:
        stmt = select(TrainingSession).where(TrainingSession.deleted_at.is_(None))
        if actor.coach:
            stmt = stmt.where(TrainingSession.coach_id == actor.coach_id)
        else:
            stmt = stmt.where(self._student_filter(actor.student_ids))
        if student_id:
            stmt = stmt.where(self._student_filter([student_id]))
        if date_from:
            stmt = stmt.where(TrainingSession.start_at >= date_from)
        if date_to:
            stmt = stmt.where(TrainingSession.start_at < date_to)
        if class_id:
            stmt = stmt.where(TrainingSession.class_id == class_id)
        if status:
            stmt = stmt.where(TrainingSession.status == status)
        elif not include_cancelled:
            stmt = stmt.where(TrainingSession.status != SessionStatus.CANCELLED)
        return [self.to_out(s) for s in self.db.scalars(stmt.order_by(TrainingSession.start_at).limit(1000))]

    def _student_filter(self, student_ids):
        ids = list(student_ids) or [uuid.uuid4()]
        term_ids = select(TermMember.term_id).where(TermMember.student_id.in_(ids))
        class_ids = select(ClassMember.class_id).where(ClassMember.student_id.in_(ids), ClassMember.is_active.is_(True))
        att = select(Attendance.session_id).where(Attendance.student_id.in_(ids))
        return or_(TrainingSession.term_id.in_(term_ids),
                   (TrainingSession.term_id.is_(None)) & TrainingSession.class_id.in_(class_ids),
                   TrainingSession.id.in_(att))

    def get_entity(self, actor: Actor, session_id: uuid.UUID) -> TrainingSession:
        if actor.coach:
            return self.repo.get_owned(TrainingSession, session_id, actor.coach_id)
        s = self.db.scalar(select(TrainingSession).where(
            TrainingSession.id == session_id, TrainingSession.deleted_at.is_(None),
            self._student_filter(actor.student_ids)))
        if not s:
            raise NotFoundError("Session not found")
        return s

    def detail(self, actor: Actor, session_id: uuid.UUID) -> dict:
        s = self.get_entity(actor, session_id)
        d = self.to_out(s)
        term = self.db.get(Term, s.term_id) if s.term_id else None
        d["term_title"] = term.title if term else None
        d["total_sessions"] = term.total_sessions if term else None
        att = {a.student_id: a for a in self.db.scalars(select(Attendance).where(Attendance.session_id == s.id))}
        shares = {}
        if term:
            shares = {m.student_id: m.share_per_session for m in term.members}
        students = self.participants(s)
        if not actor.coach:  # a student only sees himself
            students = [st for st in students if st.id in actor.student_ids]
        d["students"] = []
        for st in students:
            a = att.get(st.id)
            acc = st.account
            d["students"].append({
                "student_id": st.id, "full_name": st.full_name,
                "attendance_status": a.status.value if a else None,
                "absence_reason": a.absence_reason.value if a and a.absence_reason else None,
                "is_chargeable": a.is_chargeable if a else None,
                "share": shares.get(st.id, s.session_price),
                "financial_status": acc.status if acc else "settled",
                "balance": acc.balance if acc else 0,
                "remaining_sessions": remaining_sessions(self.db, term, st.id) if term else None,
            })
        d["history"] = [
            {"change_type": h.change_type.value, "old_start_at": h.old_start_at, "new_start_at": h.new_start_at,
             "reason": h.reason, "created_at": h.created_at}
            for h in self.history(actor, s.id)
        ] if actor.coach else []
        if not actor.coach:
            d["coach_income"] = d["court_cost"] = 0
        return d

    def history(self, actor: Actor, session_id: uuid.UUID) -> list[SessionChangeLog]:
        self.get_entity(actor, session_id)
        return list(self.db.scalars(select(SessionChangeLog).where(SessionChangeLog.session_id == session_id)
                                    .order_by(SessionChangeLog.created_at.desc())))

    # ------------------------------------------------------------------ commands
    def create(self, actor: Actor, data: SessionCreate) -> dict:
        c = self.repo.get_owned(TennisClass, data.class_id, actor.coach_id)
        term = self.repo.get_owned(Term, data.term_id, actor.coach_id) if data.term_id else None
        if term and term.class_id != c.id:
            raise ValidationError("Term does not belong to this class", code="term_mismatch")
        if data.makeup_for_id:
            self.repo.get_owned(TrainingSession, data.makeup_for_id, actor.coach_id)
        src = term or c
        s = TrainingSession(
            id=data.id or uuid.uuid4(), coach_id=actor.coach_id, class_id=c.id, term_id=term.id if term else None,
            start_at=data.start_at, end_at=data.end_at, status=SessionStatus.SCHEDULED,
            is_makeup=data.is_makeup or bool(data.makeup_for_id), makeup_for_id=data.makeup_for_id,
            session_price=src.session_price, court_cost=src.court_cost, coach_income=src.coach_income,
            location=data.location or c.location, notes=data.notes,
        )
        self.db.add(s)
        self.db.flush()
        self._log(actor, s, SessionChangeType.CREATED)
        self._renumber(s.term_id)
        ntype = NotificationType.MAKEUP_CREATED if s.is_makeup else NotificationType.SESSION_CREATED
        title = "جلسه جبرانی" if s.is_makeup else "جلسه جدید"
        self.notifier.notify_students(self.participants(s), ntype, title,
                                      f"{c.name} - {self._local(actor, s.start_at)}",
                                      {"session_id": str(s.id), "start_at": s.start_at.isoformat()})
        self.db.commit()
        return self.to_out(s)

    def update(self, actor: Actor, session_id: uuid.UUID, data: SessionUpdate) -> dict:
        s = self.repo.get_owned(TrainingSession, session_id, actor.coach_id)
        if data.version is not None and data.version != s.version:
            raise ConflictError("Session was modified by someone else", code="version_conflict",
                                details={"current_version": s.version})
        old = (s.start_at, s.end_at)
        payload = data.model_dump(exclude_unset=True, exclude={"version", "reason"})
        if "start_at" in payload and "end_at" not in payload:
            payload["end_at"] = payload["start_at"] + (s.end_at - s.start_at)
        for k, v in payload.items():
            setattr(s, k, v)
        if s.end_at <= s.start_at:
            raise ValidationError("end_at must be after start_at", code="invalid_time")
        s.version += 1
        moved = old != (s.start_at, s.end_at)
        self._log(actor, s, SessionChangeType.RESCHEDULED if moved else SessionChangeType.UPDATED, old, data.reason)
        if moved:
            self._renumber(s.term_id)
            self.notifier.notify_students(
                self.participants(s), NotificationType.SESSION_RESCHEDULED, "تغییر زمان جلسه",
                f"{self._local(actor, old[0])} ← {self._local(actor, s.start_at)}",
                {"session_id": str(s.id), "old_start_at": old[0].isoformat(), "start_at": s.start_at.isoformat()},
            )
        self.db.commit()
        return self.to_out(s)

    def cancel(self, actor: Actor, session_id: uuid.UUID, data: CancelIn) -> dict:
        s = self.repo.get_owned(TrainingSession, session_id, actor.coach_id)
        if s.status == SessionStatus.CANCELLED:
            return self.to_out(s)
        s.status = SessionStatus.CANCELLED
        s.cancel_reason = data.reason
        s.version += 1
        students = self.participants(s)
        term = self.db.get(Term, s.term_id) if s.term_id else None
        existing = {a.student_id: a for a in self.db.scalars(select(Attendance).where(Attendance.session_id == s.id))}
        for st in students:
            a = existing.get(st.id) or Attendance(session_id=s.id, student_id=st.id)
            a.status, a.is_chargeable, a.recorded_at = AttendanceStatus.CANCELLED, False, utcnow()
            a.recorded_by_user_id = actor.user.id
            self.db.add(a)
            self.finance.sync_session_charge(s, term, st.id, False, s.start_at.astimezone(actor.tz).date())
        if data.suggest_makeup and term:
            self.db.add(MakeupSession(coach_id=actor.coach_id, original_session_id=s.id, term_id=term.id,
                                      reason=data.reason, status=MakeupStatus.PENDING))
        self._log(actor, s, SessionChangeType.CANCELLED, (s.start_at, s.end_at), data.reason)
        self._renumber(s.term_id)
        self.db.flush()
        self.finance.recalc_many([st.id for st in students], actor.today())
        self.notifier.notify_students(students, NotificationType.SESSION_CANCELLED, "لغو جلسه",
                                      f"جلسه {self._local(actor, s.start_at)} لغو شد. {data.reason or ''}".strip(),
                                      {"session_id": str(s.id)})
        self.db.commit()
        out = self.to_out(s)
        out["makeup_suggestion"] = "برای جبران جلسه لغوشده، یک جلسه جدید در زمان مناسب ایجاد کنید." if term else None
        return out

    def restore(self, actor: Actor, session_id: uuid.UUID) -> dict:
        s = self.repo.get_owned(TrainingSession, session_id, actor.coach_id)
        if s.status != SessionStatus.CANCELLED:
            return self.to_out(s)
        s.status, s.cancel_reason = SessionStatus.SCHEDULED, None
        s.version += 1
        for a in self.db.scalars(select(Attendance).where(Attendance.session_id == s.id,
                                                          Attendance.status == AttendanceStatus.CANCELLED)):
            self.db.delete(a)
        for m in self.db.scalars(select(MakeupSession).where(MakeupSession.original_session_id == s.id,
                                                             MakeupSession.status == MakeupStatus.PENDING)):
            m.status = MakeupStatus.DISMISSED
        self._log(actor, s, SessionChangeType.RESTORED)
        self._renumber(s.term_id)
        self.db.commit()
        return self.to_out(s)

    def delete(self, actor: Actor, session_id: uuid.UUID) -> None:
        s = self.repo.get_owned(TrainingSession, session_id, actor.coach_id)
        term = self.db.get(Term, s.term_id) if s.term_id else None
        students = self.participants(s)
        for st in students:
            self.finance.sync_session_charge(s, term, st.id, False, s.start_at.date())
        s.deleted_at = utcnow()
        s.version += 1
        self._log(actor, s, SessionChangeType.DELETED)
        self._renumber(s.term_id)
        self.db.flush()
        self.finance.recalc_many([st.id for st in students], actor.today())
        self.db.commit()

    def create_makeup(self, actor: Actor, original_id: uuid.UUID, data: MakeupCreate) -> dict:
        orig = self.repo.get_owned(TrainingSession, original_id, actor.coach_id)
        out = self.create(actor, SessionCreate(
            class_id=orig.class_id, term_id=orig.term_id, start_at=data.start_at, end_at=data.end_at,
            notes=data.notes, is_makeup=True, makeup_for_id=orig.id))
        stmt = select(MakeupSession).where(MakeupSession.original_session_id == orig.id,
                                           MakeupSession.status == MakeupStatus.PENDING)
        if data.makeup_id:
            stmt = select(MakeupSession).where(MakeupSession.id == data.makeup_id, MakeupSession.coach_id == actor.coach_id)
        elif data.student_id:
            stmt = stmt.where(MakeupSession.student_id == data.student_id)
        m = self.db.scalar(stmt.limit(1))
        if m is None:
            m = MakeupSession(coach_id=actor.coach_id, original_session_id=orig.id, term_id=orig.term_id,
                              student_id=data.student_id)
            self.db.add(m)
        m.makeup_session_id, m.status = out["id"], MakeupStatus.SCHEDULED
        self.db.commit()
        return out

    def list_makeups(self, actor: Actor, status: MakeupStatus | None = MakeupStatus.PENDING) -> list[dict]:
        stmt = select(MakeupSession).where(MakeupSession.coach_id == actor.coach_id)
        if status:
            stmt = stmt.where(MakeupSession.status == status)
        out = []
        for m in self.db.scalars(stmt.order_by(MakeupSession.created_at.desc())):
            orig = self.db.get(TrainingSession, m.original_session_id)
            st = self.db.get(Student, m.student_id) if m.student_id else None
            out.append({
                "id": m.id, "original_session_id": m.original_session_id, "makeup_session_id": m.makeup_session_id,
                "student_id": m.student_id, "term_id": m.term_id, "reason": m.reason, "status": m.status.value,
                "created_at": m.created_at, "original_start_at": orig.start_at if orig else None,
                "class_name": orig.tennis_class.name if orig else None,
                "student_name": st.full_name if st else None,
                "suggestion": "برای جبران جلسه لغوشده، یک جلسه جدید در زمان مناسب ایجاد کنید.",
            })
        return out

    def dismiss_makeup(self, actor: Actor, makeup_id: uuid.UUID) -> None:
        m = self.repo.get_owned(MakeupSession, makeup_id, actor.coach_id)
        m.status = MakeupStatus.DISMISSED
        self.db.commit()

    def suggest_slots(self, actor: Actor, session_id: uuid.UUID, days: int = 7) -> list[dict]:
        """Suggest free 1-slot windows (same time on following days) without conflicts."""
        orig = self.repo.get_owned(TrainingSession, session_id, actor.coach_id)
        dur = orig.end_at - orig.start_at
        now = datetime.now(timezone.utc)
        base = max(orig.start_at, now)
        busy = list(self.db.scalars(select(TrainingSession).where(
            TrainingSession.coach_id == actor.coach_id, TrainingSession.deleted_at.is_(None),
            TrainingSession.status != SessionStatus.CANCELLED,
            TrainingSession.start_at >= base, TrainingSession.start_at < base + timedelta(days=days + 1))))
        out = []
        local_t = orig.start_at.astimezone(actor.tz).timetz()
        for i in range(1, days + 1):
            day = (base + timedelta(days=i)).astimezone(actor.tz).date()
            start = datetime.combine(day, local_t).astimezone(timezone.utc)
            end = start + dur
            if not any(b.start_at < end and start < b.end_at for b in busy):
                out.append({"start_at": start, "end_at": end})
        return out
