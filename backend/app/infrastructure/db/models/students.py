import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums import PlayerLevel, StudentStatus
from app.infrastructure.db.base import Base, SyncMixin, TimestampMixin, UUIDPkMixin
from app.infrastructure.db.models.identity import enum_col


class Student(UUIDPkMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "students"
    __table_args__ = (
        Index("ix_students_coach_status", "coach_id", "status"),
        CheckConstraint("age IS NULL OR (age >= 3 AND age <= 100)", name="age_range"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    # Linked login account (optional – coach can manage students without app accounts)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    level: Mapped[PlayerLevel] = mapped_column(enum_col(PlayerLevel), default=PlayerLevel.BEGINNER)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    strengths: Mapped[str | None] = mapped_column(Text, nullable=True)
    weaknesses: Mapped[str | None] = mapped_column(Text, nullable=True)
    goals: Mapped[str | None] = mapped_column(Text, nullable=True)
    coach_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[StudentStatus] = mapped_column(enum_col(StudentStatus), default=StudentStatus.ACTIVE)

    account: Mapped["FinancialAccount | None"] = relationship(back_populates="student", uselist=False)  # noqa: F821

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
