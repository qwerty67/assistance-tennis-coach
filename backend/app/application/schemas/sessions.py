import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.application.schemas.common import ORMModel
from app.domain.enums import AbsenceReason, AttendanceStatus, SessionStatus


class SessionCreate(BaseModel):
    id: uuid.UUID | None = None
    class_id: uuid.UUID
    term_id: uuid.UUID | None = None
    start_at: datetime
    end_at: datetime
    location: str | None = None
    notes: str | None = None
    is_makeup: bool = False
    makeup_for_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def order(self):
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self


class SessionUpdate(BaseModel):
    start_at: datetime | None = None
    end_at: datetime | None = None
    location: str | None = None
    notes: str | None = None
    status: SessionStatus | None = None
    reason: str | None = Field(default=None, max_length=255)
    version: int | None = None  # optimistic concurrency (offline sync)


class CancelIn(BaseModel):
    reason: str | None = Field(default=None, max_length=255)
    suggest_makeup: bool = True


class MakeupCreate(BaseModel):
    start_at: datetime
    end_at: datetime
    student_id: uuid.UUID | None = None
    notes: str | None = None
    makeup_id: uuid.UUID | None = None  # pending MakeupSession to fulfil


class AttendanceIn(BaseModel):
    session_id: uuid.UUID
    student_id: uuid.UUID
    status: AttendanceStatus
    absence_reason: AbsenceReason | None = None
    note: str | None = None
    is_chargeable: bool | None = None  # None = use coach rules
    client_mutation_id: str | None = Field(default=None, max_length=64)


class AttendanceItem(BaseModel):
    student_id: uuid.UUID
    status: AttendanceStatus
    absence_reason: AbsenceReason | None = None
    note: str | None = None
    is_chargeable: bool | None = None


class AttendanceBulkIn(BaseModel):
    session_id: uuid.UUID
    records: list[AttendanceItem] = Field(min_length=1)
    complete_session: bool = True
    client_mutation_id: str | None = None


class AttendanceOut(ORMModel):
    id: uuid.UUID
    session_id: uuid.UUID
    student_id: uuid.UUID
    status: AttendanceStatus
    absence_reason: AbsenceReason | None
    note: str | None
    is_chargeable: bool
    charge_overridden: bool
    recorded_at: datetime | None
    student_name: str | None = None
    session_start_at: datetime | None = None
    class_name: str | None = None


class SessionStudentOut(BaseModel):
    student_id: uuid.UUID
    full_name: str
    attendance_status: str | None
    absence_reason: str | None
    is_chargeable: bool | None
    share: int
    financial_status: str
    balance: int
    remaining_sessions: int | None


class SessionOut(ORMModel):
    id: uuid.UUID
    class_id: uuid.UUID
    term_id: uuid.UUID | None
    class_name: str = ""
    class_type: str = ""
    color: str | None = None
    sequence_number: int | None
    start_at: datetime
    end_at: datetime
    duration_minutes: int = 0
    status: SessionStatus
    is_makeup: bool
    makeup_for_id: uuid.UUID | None
    session_price: int
    court_cost: int
    coach_income: int
    location: str | None
    notes: str | None
    cancel_reason: str | None
    version: int
    student_count: int = 0
    attendance_done: bool = False
    student_names: list[str] = []


class SessionDetailOut(SessionOut):
    students: list[SessionStudentOut] = []
    term_title: str | None = None
    total_sessions: int | None = None
    history: list[dict] = []


class ChangeLogOut(ORMModel):
    id: uuid.UUID
    change_type: str
    old_start_at: datetime | None
    old_end_at: datetime | None
    new_start_at: datetime | None
    new_end_at: datetime | None
    reason: str | None
    created_at: datetime


class MakeupOut(ORMModel):
    id: uuid.UUID
    original_session_id: uuid.UUID
    makeup_session_id: uuid.UUID | None
    student_id: uuid.UUID | None
    term_id: uuid.UUID | None
    reason: str | None
    status: str
    created_at: datetime
    original_start_at: datetime | None = None
    class_name: str | None = None
    student_name: str | None = None
    suggestion: str | None = None
