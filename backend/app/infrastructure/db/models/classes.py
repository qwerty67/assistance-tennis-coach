import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, Date, ForeignKey, Index, Integer, String, Text, Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums import (
    BillingMode, ClassType, MakeupStatus, PaymentPlan, ScheduleType, SessionChangeType,
    SessionStatus, TermStatus, TermType,
)
from app.infrastructure.db.base import Base, SyncMixin, TimestampMixin, UUIDPkMixin
from app.infrastructure.db.models.identity import enum_col
from app.infrastructure.db.types import UTCDateTime


class TennisClass(UUIDPkMixin, TimestampMixin, SyncMixin, Base):
    """A class template: type, capacity, duration and default pricing (never hard-coded)."""

    __tablename__ = "classes"
    __table_args__ = (
        CheckConstraint("capacity_min >= 1", name="capacity_min_pos"),
        CheckConstraint("capacity_max >= capacity_min", name="capacity_order"),
        CheckConstraint("duration_minutes > 0", name="duration_pos"),
        CheckConstraint("session_price >= 0 AND court_cost >= 0 AND coach_income >= 0", name="price_pos"),
        CheckConstraint("monthly_fee >= 0", name="monthly_fee_pos"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    class_type: Mapped[ClassType] = mapped_column(enum_col(ClassType), index=True)
    capacity_min: Mapped[int] = mapped_column(Integer, default=1)
    capacity_max: Mapped[int] = mapped_column(Integer, default=1)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    session_price: Mapped[int] = mapped_column(BigInteger, default=0)  # total price of one session
    court_cost: Mapped[int] = mapped_column(BigInteger, default=0)
    coach_income: Mapped[int] = mapped_column(BigInteger, default=0)
    monthly_fee: Mapped[int] = mapped_column(BigInteger, default=0)  # per student (group)
    billing_mode: Mapped[BillingMode] = mapped_column(enum_col(BillingMode), default=BillingMode.PER_STUDENT)
    color: Mapped[str | None] = mapped_column(String(9), nullable=True)
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    members: Mapped[list["ClassMember"]] = relationship(back_populates="tennis_class", cascade="all, delete-orphan")


class ClassMember(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "class_members"
    __table_args__ = (UniqueConstraint("class_id", "student_id", name="class_student"),)

    class_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    joined_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    left_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    tennis_class: Mapped[TennisClass] = relationship(back_populates="members")


class Term(UUIDPkMixin, TimestampMixin, SyncMixin, Base):
    """A billing / enrollment period (e.g. 10 sessions, 20 sessions, monthly, custom)."""

    __tablename__ = "terms"
    __table_args__ = (
        CheckConstraint("total_sessions IS NULL OR total_sessions > 0", name="sessions_pos"),
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="date_order"),
        CheckConstraint("installments_count >= 1", name="installments_pos"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    class_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    term_type: Mapped[TermType] = mapped_column(enum_col(TermType))
    total_sessions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    session_price: Mapped[int] = mapped_column(BigInteger, default=0)
    court_cost: Mapped[int] = mapped_column(BigInteger, default=0)
    coach_income: Mapped[int] = mapped_column(BigInteger, default=0)
    monthly_fee: Mapped[int] = mapped_column(BigInteger, default=0)
    total_price: Mapped[int] = mapped_column(BigInteger, default=0)
    billing_mode: Mapped[BillingMode] = mapped_column(enum_col(BillingMode))
    payer_student_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("students.id", ondelete="SET NULL"), nullable=True
    )
    payment_plan: Mapped[PaymentPlan] = mapped_column(enum_col(PaymentPlan))
    installments_count: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[TermStatus] = mapped_column(enum_col(TermStatus), default=TermStatus.ACTIVE, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    members: Mapped[list["TermMember"]] = relationship(back_populates="term", cascade="all, delete-orphan")
    tennis_class: Mapped[TennisClass] = relationship()


class TermMember(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "term_members"
    __table_args__ = (UniqueConstraint("term_id", "student_id", name="term_student"),)

    term_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    share_per_session: Mapped[int] = mapped_column(BigInteger, default=0)  # or monthly share for monthly terms
    share_overridden: Mapped[bool] = mapped_column(Boolean, default=False)

    term: Mapped[Term] = relationship(back_populates="members")


class Schedule(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "schedules"

    class_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"), index=True)
    term_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"), nullable=True, index=True)
    schedule_type: Mapped[ScheduleType] = mapped_column(enum_col(ScheduleType))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Tehran")

    slots: Mapped[list["ScheduleSlot"]] = relationship(back_populates="schedule", cascade="all, delete-orphan")


class ScheduleSlot(UUIDPkMixin, Base):
    __tablename__ = "schedule_slots"
    __table_args__ = (
        CheckConstraint("weekday IS NULL OR (weekday >= 0 AND weekday <= 6)", name="weekday_range"),
        CheckConstraint("end_time > start_time", name="time_order"),
    )

    schedule_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("schedules.id", ondelete="CASCADE"), index=True)
    weekday: Mapped[int | None] = mapped_column(Integer, nullable=True)
    on_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)

    schedule: Mapped[Schedule] = relationship(back_populates="slots")


class TrainingSession(UUIDPkMixin, TimestampMixin, SyncMixin, Base):
    """A concrete class meeting on the calendar."""

    __tablename__ = "sessions"
    __table_args__ = (
        Index("ix_sessions_coach_start", "coach_id", "start_at"),
        CheckConstraint("end_at > start_at", name="time_order"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    class_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"), index=True)
    term_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("terms.id", ondelete="SET NULL"), nullable=True, index=True)
    schedule_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("schedules.id", ondelete="SET NULL"), nullable=True)
    sequence_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_at: Mapped[datetime] = mapped_column(UTCDateTime, index=True)
    end_at: Mapped[datetime] = mapped_column(UTCDateTime)
    status: Mapped[SessionStatus] = mapped_column(enum_col(SessionStatus), default=SessionStatus.SCHEDULED, index=True)
    is_makeup: Mapped[bool] = mapped_column(Boolean, default=False)
    makeup_for_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    session_price: Mapped[int] = mapped_column(BigInteger, default=0)
    court_cost: Mapped[int] = mapped_column(BigInteger, default=0)
    coach_income: Mapped[int] = mapped_column(BigInteger, default=0)
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    tennis_class: Mapped[TennisClass] = relationship()
    term: Mapped[Term | None] = relationship()


class SessionChangeLog(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "session_change_logs"

    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    changed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    change_type: Mapped[SessionChangeType] = mapped_column(enum_col(SessionChangeType))
    old_start_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    old_end_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    new_start_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    new_end_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)


class MakeupSession(UUIDPkMixin, TimestampMixin, Base):
    """Tracks a session that must be compensated (cancelled session or excused absence)."""

    __tablename__ = "makeup_sessions"

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    original_session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    makeup_session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    student_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=True)
    term_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("terms.id", ondelete="CASCADE"), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[MakeupStatus] = mapped_column(enum_col(MakeupStatus), default=MakeupStatus.PENDING, index=True)

    original_session: Mapped[TrainingSession] = relationship(foreign_keys=[original_session_id])
