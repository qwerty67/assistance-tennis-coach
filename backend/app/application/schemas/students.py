import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.application.schemas.common import ORMModel, Phone
from app.domain.enums import PlayerLevel, StudentStatus


class StudentBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    age: int | None = Field(default=None, ge=3, le=100)
    birth_date: date | None = None
    phone: Phone | None = None
    email: EmailStr | None = None
    level: PlayerLevel = PlayerLevel.BEGINNER
    start_date: date | None = None
    strengths: str | None = None
    weaknesses: str | None = None
    goals: str | None = None
    coach_notes: str | None = None


class StudentCreate(StudentBase):
    id: uuid.UUID | None = None  # optional client-generated id (offline-ready)


class StudentUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    age: int | None = Field(default=None, ge=3, le=100)
    birth_date: date | None = None
    phone: Phone | None = None
    email: EmailStr | None = None
    level: PlayerLevel | None = None
    start_date: date | None = None
    strengths: str | None = None
    weaknesses: str | None = None
    goals: str | None = None
    coach_notes: str | None = None
    status: StudentStatus | None = None


class AccountOut(ORMModel):
    total_charged: int = 0
    total_paid: int = 0
    balance: int = 0
    overdue_amount: int = 0
    status: str = "settled"


class StudentOut(StudentBase, ORMModel):
    id: uuid.UUID
    status: StudentStatus
    has_account: bool = False
    created_at: datetime
    updated_at: datetime
    account: AccountOut | None = None


class TermUsageOut(BaseModel):
    term_id: uuid.UUID
    term_title: str
    class_id: uuid.UUID
    class_name: str
    class_type: str
    total_sessions: int | None
    used_sessions: int
    remaining_sessions: int | None
    upcoming_sessions: int
    status: str


class StudentDetailOut(StudentOut):
    terms: list[TermUsageOut] = []
    classes: list[dict] = []
    recent_attendance: list[dict] = []
    recent_payments: list[dict] = []
    training_plans: list[dict] = []
    attendance_stats: dict = {}
