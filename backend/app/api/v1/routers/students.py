import uuid

from fastapi import APIRouter, Query, Response

from app.api.deps import DB, CoachActor
from app.application.schemas.finance import AccountDetailOut
from app.application.schemas.sessions import AttendanceOut
from app.application.schemas.students import (
    StudentCreate, StudentDetailOut, StudentOut, StudentUpdate,
)
from app.application.services.attendance_service import AttendanceService
from app.application.services.finance_service import FinanceService
from app.application.services.student_service import StudentService
from app.domain.enums import PlayerLevel, StudentStatus
from app.infrastructure.db.models import Student

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentOut])
def list_students(actor: CoachActor, db: DB, q: str | None = Query(None, max_length=80),
                  status: StudentStatus | None = None, level: PlayerLevel | None = None,
                  financial_status: str | None = None):
    return StudentService(db).list(actor, q, status, level, financial_status)


@router.post("", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, actor: CoachActor, db: DB):
    return StudentService(db).create(actor, data)


@router.get("/{student_id}", response_model=StudentDetailOut)
def get_student(student_id: uuid.UUID, actor: CoachActor, db: DB):
    return StudentService(db).detail(actor, student_id)


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: uuid.UUID, data: StudentUpdate, actor: CoachActor, db: DB):
    return StudentService(db).update(actor, student_id, data)


@router.post("/{student_id}/deactivate", response_model=StudentOut)
def deactivate(student_id: uuid.UUID, actor: CoachActor, db: DB):
    return StudentService(db).set_status(actor, student_id, StudentStatus.INACTIVE)


@router.post("/{student_id}/activate", response_model=StudentOut)
def activate(student_id: uuid.UUID, actor: CoachActor, db: DB):
    return StudentService(db).set_status(actor, student_id, StudentStatus.ACTIVE)


@router.post("/{student_id}/disconnect", response_model=StudentOut)
def disconnect_student(student_id: uuid.UUID, actor: CoachActor, db: DB):
    """Deactivates coach-student relationship while strictly preserving all training & financial history."""
    return StudentService(db).disconnect(actor, student_id)


@router.post("/{student_id}/reconnect", response_model=StudentOut)
def reconnect_student(student_id: uuid.UUID, actor: CoachActor, db: DB):
    """Reactivates connection with student."""
    return StudentService(db).reconnect(actor, student_id)


@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: uuid.UUID, actor: CoachActor, db: DB):
    StudentService(db).delete(actor, student_id)
    return Response(status_code=204)


@router.get("/{student_id}/account", response_model=AccountDetailOut)
def student_account(student_id: uuid.UUID, actor: CoachActor, db: DB):
    return FinanceService(db).account_detail(actor, student_id)


@router.get("/{student_id}/attendance", response_model=list[AttendanceOut])
def student_attendance(student_id: uuid.UUID, actor: CoachActor, db: DB):
    StudentService(db).repo.get_owned(Student, student_id, actor.coach_id)
    return AttendanceService(db).list(actor, student_id=student_id)
