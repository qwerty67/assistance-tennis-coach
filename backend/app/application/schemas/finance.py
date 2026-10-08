import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.application.schemas.common import ORMModel
from app.domain.enums import ChargeKind, PaymentMethod


class PaymentCreate(BaseModel):
    id: uuid.UUID | None = None
    student_id: uuid.UUID
    amount: int = Field(gt=0)
    paid_at: date
    method: PaymentMethod = PaymentMethod.CASH
    description: str | None = Field(default=None, max_length=1000)
    term_id: uuid.UUID | None = None
    class_id: uuid.UUID | None = None
    reference_no: str | None = Field(default=None, max_length=64)


class PaymentOut(ORMModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str | None = None
    amount: int
    paid_at: date
    method: PaymentMethod
    description: str | None
    term_id: uuid.UUID | None
    class_id: uuid.UUID | None
    reference_no: str | None
    is_void: bool
    created_at: datetime


class ChargeCreate(BaseModel):
    student_id: uuid.UUID
    amount: int = Field(gt=0)
    kind: ChargeKind = ChargeKind.MANUAL
    due_date: date | None = None
    description: str | None = None
    term_id: uuid.UUID | None = None
    class_id: uuid.UUID | None = None
    court_cost_amount: int = Field(default=0, ge=0)


class ChargeOut(ORMModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str | None = None
    term_id: uuid.UUID | None
    class_id: uuid.UUID | None
    session_id: uuid.UUID | None
    kind: ChargeKind
    amount: int
    court_cost_amount: int
    coach_income_amount: int
    period: str | None
    installment_no: int | None
    due_date: date | None
    description: str | None
    is_void: bool
    paid: int = 0
    remaining: int = 0
    status: str = "unpaid"


class AccountDetailOut(BaseModel):
    student_id: uuid.UUID
    student_name: str
    total_tuition: int
    paid_amount: int
    remaining_amount: int
    debt: int
    credit: int
    overdue_amount: int
    status: str
    number_of_sessions: int | None
    used_sessions: int
    remaining_sessions: int | None
    charges: list[ChargeOut] = []
    payments: list[PaymentOut] = []


class SeriesPoint(BaseModel):
    key: str  # "1405-07"
    label_year: int
    label_month: int
    received: int = 0
    charged: int = 0
    coach_income: int = 0
    court_cost: int = 0


class FinancialSummaryOut(BaseModel):
    period_start: date
    period_end: date
    received: int
    charged: int
    coach_income: int
    court_cost: int
    outstanding: int  # total debts of all students (now)
    total_credit: int
    debtors_count: int
    month_income: int
    year_income: int
    monthly: list[SeriesPoint]
    by_class_type: list[dict]
    by_class: list[dict]
    by_student: list[dict]
    by_method: list[dict]
    debtors: list[dict]
