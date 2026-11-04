import uuid
from datetime import date

from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, Date, ForeignKey, Index, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums import ChargeKind, PaymentMethod
from app.infrastructure.db.base import Base, SyncMixin, TimestampMixin, UUIDPkMixin
from app.infrastructure.db.models.identity import enum_col


class Charge(UUIDPkMixin, TimestampMixin, SyncMixin, Base):
    """A receivable (debit) on a student's account: term fee, session fee, monthly fee, installment..."""

    __tablename__ = "charges"
    __table_args__ = (
        CheckConstraint("amount >= 0", name="amount_pos"),
        UniqueConstraint("student_id", "session_id", name="student_session"),
        UniqueConstraint("term_id", "student_id", "period", "kind", name="term_period"),
        Index("ix_charges_coach_due", "coach_id", "due_date"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    term_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("terms.id", ondelete="SET NULL"), nullable=True, index=True)
    class_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("classes.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    kind: Mapped[ChargeKind] = mapped_column(enum_col(ChargeKind))
    amount: Mapped[int] = mapped_column(BigInteger)
    court_cost_amount: Mapped[int] = mapped_column(BigInteger, default=0)
    coach_income_amount: Mapped[int] = mapped_column(BigInteger, default=0)
    period: Mapped[str | None] = mapped_column(String(7), nullable=True)  # "1405-07" for monthly fees
    installment_no: Mapped[int | None] = mapped_column(nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_void: Mapped[bool] = mapped_column(Boolean, default=False, index=True)


class Payment(UUIDPkMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount > 0", name="amount_pos"),
        Index("ix_payments_coach_date", "coach_id", "paid_at"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    term_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("terms.id", ondelete="SET NULL"), nullable=True)
    class_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("classes.id", ondelete="SET NULL"), nullable=True)
    amount: Mapped[int] = mapped_column(BigInteger)
    paid_at: Mapped[date] = mapped_column(Date)
    method: Mapped[PaymentMethod] = mapped_column(enum_col(PaymentMethod))
    reference_no: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_void: Mapped[bool] = mapped_column(Boolean, default=False, index=True)


class FinancialAccount(UUIDPkMixin, TimestampMixin, Base):
    """Denormalized per-student balance, recalculated after every financial change."""

    __tablename__ = "financial_accounts"

    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), unique=True)
    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    total_charged: Mapped[int] = mapped_column(BigInteger, default=0)
    total_paid: Mapped[int] = mapped_column(BigInteger, default=0)
    balance: Mapped[int] = mapped_column(BigInteger, default=0, index=True)  # paid - charged
    overdue_amount: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[str] = mapped_column(String(16), default="settled", index=True)

    student: Mapped["Student"] = relationship(back_populates="account")  # noqa: F821
