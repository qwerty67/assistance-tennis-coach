import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, Field, model_validator

from app.application.schemas.common import Money, ORMModel
from app.domain.enums import (
    BillingMode, ClassType, PaymentPlan, ScheduleType, TermStatus, TermType,
)


class ClassBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    class_type: ClassType
    capacity_min: int = Field(default=1, ge=1, le=100)
    capacity_max: int = Field(default=1, ge=1, le=100)
    duration_minutes: int = Field(default=60, gt=0, le=600)
    session_price: Money = 0
    court_cost: Money = 0
    coach_income: Money | None = None
    monthly_fee: Money = 0
    billing_mode: BillingMode | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$")
    location: str | None = None
    description: str | None = None


class ClassCreate(ClassBase):
    member_ids: list[uuid.UUID] = []


class ClassUpdate(BaseModel):
    name: str | None = None
    capacity_min: int | None = Field(default=None, ge=1)
    capacity_max: int | None = Field(default=None, ge=1)
    duration_minutes: int | None = Field(default=None, gt=0)
    session_price: Money | None = None
    court_cost: Money | None = None
    coach_income: Money | None = None
    monthly_fee: Money | None = None
    billing_mode: BillingMode | None = None
    color: str | None = None
    location: str | None = None
    description: str | None = None
    is_active: bool | None = None


class MemberOut(BaseModel):
    student_id: uuid.UUID
    full_name: str
    level: str
    is_active: bool


class ClassOut(ORMModel):
    id: uuid.UUID
    name: str
    class_type: ClassType
    capacity_min: int
    capacity_max: int
    duration_minutes: int
    session_price: int
    court_cost: int
    coach_income: int
    monthly_fee: int
    billing_mode: BillingMode
    color: str | None
    location: str | None
    description: str | None
    is_active: bool
    member_count: int = 0
    members: list[MemberOut] = []
    created_at: datetime


class SlotIn(BaseModel):
    weekday: int | None = Field(default=None, ge=0, le=6, description="0=Mon ... 5=Sat, 6=Sun")
    on_date: date | None = None
    start_time: time
    end_time: time


class ScheduleIn(BaseModel):
    schedule_type: ScheduleType = ScheduleType.RECURRING
    slots: list[SlotIn] = Field(min_length=1)
    start_date: date | None = None
    end_date: date | None = None


class TermMemberIn(BaseModel):
    student_id: uuid.UUID
    share_per_session: Money | None = None  # manual override


class TermCreate(BaseModel):
    class_id: uuid.UUID
    title: str = Field(min_length=1, max_length=120)
    term_type: TermType
    total_sessions: int | None = Field(default=None, gt=0, le=400)
    start_date: date
    end_date: date | None = None
    session_price: Money | None = None
    court_cost: Money | None = None
    coach_income: Money | None = None
    monthly_fee: Money | None = None
    billing_mode: BillingMode | None = None
    payer_student_id: uuid.UUID | None = None
    payment_plan: PaymentPlan = PaymentPlan.UPFRONT
    installments_count: int = Field(default=1, ge=1, le=24)
    members: list[TermMemberIn] | None = None  # default: active class members
    schedule: ScheduleIn | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def check(self):
        if self.term_type == TermType.FIXED_SESSIONS and not self.total_sessions:
            raise ValueError("total_sessions is required for fixed_sessions terms")
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class TermUpdate(BaseModel):
    title: str | None = None
    end_date: date | None = None
    status: TermStatus | None = None
    notes: str | None = None


class ShareUpdate(BaseModel):
    share_per_session: Money


class TermMemberOut(BaseModel):
    student_id: uuid.UUID
    full_name: str
    share_per_session: int
    share_overridden: bool
    used_sessions: int
    remaining_sessions: int | None
    total_due: int
    paid: int
    financial_status: str


class TermOut(ORMModel):
    id: uuid.UUID
    class_id: uuid.UUID
    class_name: str = ""
    class_type: str = ""
    title: str
    term_type: TermType
    total_sessions: int | None
    start_date: date
    end_date: date | None
    session_price: int
    court_cost: int
    coach_income: int
    monthly_fee: int
    total_price: int
    billing_mode: BillingMode
    payer_student_id: uuid.UUID | None
    payment_plan: PaymentPlan
    installments_count: int
    status: TermStatus
    notes: str | None
    members: list[TermMemberOut] = []
    sessions_scheduled: int = 0
    sessions_completed: int = 0
    sessions_cancelled: int = 0
    makeup_needed: int = 0
    makeup_suggestion: str | None = None


class MonthlyChargeIn(BaseModel):
    period: str = Field(pattern=r"^\d{4}-\d{2}$", description="Jalali period, e.g. 1405-07")
    due_date: date | None = None
