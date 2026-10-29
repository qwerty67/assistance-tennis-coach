import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean, CheckConstraint, Date, ForeignKey, Index, Integer, String, Text, UniqueConstraint, Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums import (
    InvitationChannel, InvitationStatus, PlayerLevel, RelationshipStatus, StudentStatus,
)
from app.infrastructure.db.base import Base, SyncMixin, TimestampMixin, UUIDPkMixin
from app.infrastructure.db.models.identity import enum_col
from app.infrastructure.db.types import UTCDateTime


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

    user: Mapped["User | None"] = relationship("User", foreign_keys=[user_id])  # noqa: F821
    account: Mapped["FinancialAccount | None"] = relationship(back_populates="student", uselist=False)  # noqa: F821
    coach_relationships: Mapped[list["CoachStudentRelationship"]] = relationship(
        "CoachStudentRelationship", back_populates="student", cascade="all, delete-orphan"
    )
    invitations: Mapped[list["CoachInvitation"]] = relationship(
        "CoachInvitation", back_populates="student"
    )

    @property
    def full_name(self) -> str:
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}"
        return f"{self.first_name} {self.last_name}"


class CoachStudentRelationship(UUIDPkMixin, TimestampMixin, Base):
    """Business Rules v2.0: Independent relationship between a Coach and a Student."""

    __tablename__ = "coach_student_relationships"
    __table_args__ = (
        UniqueConstraint("coach_id", "student_id", name="uq_coach_student_rel"),
        Index("ix_coach_student_coach_status", "coach_id", "status"),
        Index("ix_coach_student_student_status", "student_id", "status"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    status: Mapped[RelationshipStatus] = mapped_column(
        enum_col(RelationshipStatus), default=RelationshipStatus.ACTIVE, index=True
    )
    # Student's currently chosen primary active coach for their main training path
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    role_type: Mapped[str] = mapped_column(String(50), default="main")  # main, technical, fitness, etc.
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    invited_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    deactivated_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)

    coach: Mapped["Coach"] = relationship("Coach")  # noqa: F821
    student: Mapped[Student] = relationship(Student, back_populates="coach_relationships")


class CoachInvitation(UUIDPkMixin, TimestampMixin, Base):
    """Business Rules v2.0: Invitations via unique code / token / link across multiple channels."""

    __tablename__ = "coach_invitations"
    __table_args__ = (
        Index("ix_coach_invitations_code", "code", unique=True),
        Index("ix_coach_invitations_token", "token", unique=True),
        Index("ix_coach_invitations_coach_status", "coach_id", "status"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True
    )
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    code: Mapped[str] = mapped_column(String(16), unique=True)
    token: Mapped[str] = mapped_column(String(64), unique=True)
    status: Mapped[InvitationStatus] = mapped_column(
        enum_col(InvitationStatus), default=InvitationStatus.CREATED, index=True
    )
    channel: Mapped[InvitationChannel] = mapped_column(
        enum_col(InvitationChannel), default=InvitationChannel.MANUAL
    )
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime, index=True)
    used_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    used_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    coach: Mapped["Coach"] = relationship("Coach")  # noqa: F821
    student: Mapped[Student | None] = relationship(Student, back_populates="invitations")
