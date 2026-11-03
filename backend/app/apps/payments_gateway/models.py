import uuid
from datetime import datetime
from sqlalchemy import BigInteger, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.db.base import Base, TimestampMixin, UUIDPkMixin

class OnlinePaymentTransaction(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "online_payment_transactions"
    __table_args__ = (
        Index("ix_online_pay_student", "student_id"),
        Index("ix_online_pay_coach", "coach_id"),
        Index("ix_online_pay_authority", "authority", unique=True),
    )

    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    amount: Mapped[int] = mapped_column(BigInteger)
    gateway: Mapped[str] = mapped_column(String(32), default="mock")
    authority: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending, success, failed
    term_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("terms.id", ondelete="SET NULL"), nullable=True)
    class_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("classes.id", ondelete="SET NULL"), nullable=True)
    ref_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    card_pan: Mapped[str | None] = mapped_column(String(32), nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
