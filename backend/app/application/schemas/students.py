import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.application.schemas.common import ORMModel, Phone
from app.domain.enums import (
    InvitationChannel, InvitationStatus, PlayerLevel, RelationshipStatus, StudentStatus,
)


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
    with_invitation: bool = False
    invitation_channel: InvitationChannel = InvitationChannel.MANUAL


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


class CoachInvitationOut(ORMModel):
    id: uuid.UUID
    coach_id: uuid.UUID
    student_id: uuid.UUID | None = None
    phone: str | None = None
    code: str
    token: str
    invite_url: str = ""
    status: InvitationStatus
    channel: InvitationChannel
    expires_at: datetime
    created_at: datetime


class CoachInvitationCreate(BaseModel):
    student_id: uuid.UUID | None = None
    phone: Phone | None = None
    channel: InvitationChannel = InvitationChannel.MANUAL
    expires_in_days: int = Field(default=30, ge=1, le=365)


class CoachInvitationPreview(BaseModel):
    code: str
    coach_id: uuid.UUID
    coach_name: str
    coach_bio: str | None = None
    coach_phone: str | None = None


class AcceptInvitationIn(BaseModel):
    code: str
    set_as_primary: bool = True


class StudentCoachOut(BaseModel):
    coach_id: uuid.UUID
    coach_name: str
    coach_bio: str | None = None
    coach_phone: str | None = None
    status: RelationshipStatus
    is_primary: bool
    role_type: str = "main"
    connected_at: datetime


class StudentOut(StudentBase, ORMModel):
    id: uuid.UUID
    status: StudentStatus
    relationship_status: RelationshipStatus = RelationshipStatus.ACTIVE
    is_primary: bool = False
    has_account: bool = False
    created_at: datetime
    updated_at: datetime
    account: AccountOut | None = None
    invitation: CoachInvitationOut | None = None


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
