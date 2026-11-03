import uuid
from datetime import datetime

from fastapi import APIRouter, Response

from app.api.deps import DB, CoachActor, CurrentActor
from app.application.schemas.sessions import (
    AttendanceBulkIn, AttendanceIn, AttendanceOut, CancelIn, ChangeLogOut, MakeupCreate, MakeupOut,
    SessionCreate, SessionDetailOut, SessionOut, SessionUpdate,
)
from app.application.services.attendance_service import AttendanceService
from app.application.services.session_service import SessionService
from app.domain.enums import MakeupStatus, SessionStatus

router = APIRouter(tags=["sessions & attendance"])


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(actor: CurrentActor, db: DB, date_from: datetime | None = None, date_to: datetime | None = None,
                  class_id: uuid.UUID | None = None, student_id: uuid.UUID | None = None,
                  status: SessionStatus | None = None):
    """Coach: all own sessions. Student: only sessions he participates in."""
    if not actor.coach:
        student_id = None
    return SessionService(db).list(actor, date_from, date_to, class_id, student_id, status)


@router.post("/sessions", response_model=SessionOut, status_code=201)
def create_session(data: SessionCreate, actor: CoachActor, db: DB):
    return SessionService(db).create(actor, data)


@router.get("/sessions/{session_id}", response_model=SessionDetailOut)
def get_session(session_id: uuid.UUID, actor: CurrentActor, db: DB):
    return SessionService(db).detail(actor, session_id)


@router.put("/sessions/{session_id}", response_model=SessionOut)
def update_session(session_id: uuid.UUID, data: SessionUpdate, actor: CoachActor, db: DB):
    return SessionService(db).update(actor, session_id, data)


@router.patch("/sessions/{session_id}", response_model=SessionOut)
def patch_session(session_id: uuid.UUID, data: SessionUpdate, actor: CoachActor, db: DB):
    return SessionService(db).update(actor, session_id, data)


@router.post("/sessions/{session_id}/cancel")
def cancel_session(session_id: uuid.UUID, data: CancelIn, actor: CoachActor, db: DB):
    return SessionService(db).cancel(actor, session_id, data)


@router.post("/sessions/{session_id}/restore", response_model=SessionOut)
def restore_session(session_id: uuid.UUID, actor: CoachActor, db: DB):
    return SessionService(db).restore(actor, session_id)


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: uuid.UUID, actor: CoachActor, db: DB):
    SessionService(db).delete(actor, session_id)
    return Response(status_code=204)


@router.post("/sessions/{session_id}/makeup", response_model=SessionOut, status_code=201)
def create_makeup(session_id: uuid.UUID, data: MakeupCreate, actor: CoachActor, db: DB):
    return SessionService(db).create_makeup(actor, session_id, data)


@router.get("/sessions/{session_id}/makeup-suggestions")
def makeup_suggestions(session_id: uuid.UUID, actor: CoachActor, db: DB):
    return SessionService(db).suggest_slots(actor, session_id)


@router.get("/sessions/{session_id}/history", response_model=list[ChangeLogOut])
def session_history(session_id: uuid.UUID, actor: CoachActor, db: DB):
    return SessionService(db).history(actor, session_id)


@router.get("/makeups", response_model=list[MakeupOut])
def list_makeups(actor: CoachActor, db: DB, status: MakeupStatus | None = MakeupStatus.PENDING):
    return SessionService(db).list_makeups(actor, status)


@router.post("/makeups/{makeup_id}/dismiss", status_code=204)
def dismiss_makeup(makeup_id: uuid.UUID, actor: CoachActor, db: DB):
    SessionService(db).dismiss_makeup(actor, makeup_id)
    return Response(status_code=204)


# ---------------------------------------------------------------- attendance
@router.get("/attendance", response_model=list[AttendanceOut])
def list_attendance(actor: CurrentActor, db: DB, session_id: uuid.UUID | None = None,
                    student_id: uuid.UUID | None = None):
    return AttendanceService(db).list(actor, session_id, student_id if actor.coach else None)


@router.post("/attendance", response_model=AttendanceOut, status_code=201)
def record_attendance(data: AttendanceIn, actor: CoachActor, db: DB):
    return AttendanceService(db).record(actor, data)


@router.post("/attendance/bulk")
def bulk_attendance(data: AttendanceBulkIn, actor: CoachActor, db: DB):
    """Register attendance for a whole session in one tap and mark the session completed."""
    return AttendanceService(db).bulk(actor, data)
