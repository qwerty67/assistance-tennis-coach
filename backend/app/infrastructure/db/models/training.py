import uuid
from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums import ExerciseStatus, Intensity, PlanStatus, TrainingCategory
from app.infrastructure.db.base import Base, SyncMixin, TimestampMixin, UUIDPkMixin
from app.infrastructure.db.models.identity import enum_col
from app.infrastructure.db.types import UTCDateTime


class TrainingPlan(UUIDPkMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "training_plans"

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[PlanStatus] = mapped_column(enum_col(PlanStatus), default=PlanStatus.ACTIVE)

    exercises: Mapped[list["TrainingExercise"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan", order_by="TrainingExercise.order_index"
    )


class TrainingExercise(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "training_exercises"

    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("training_plans.id", ondelete="CASCADE"), index=True)
    category: Mapped[TrainingCategory] = mapped_column(enum_col(TrainingCategory), index=True)
    skill: Mapped[str | None] = mapped_column(String(64), nullable=True)  # forehand, serve_plus_one, focus ...
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sets: Mapped[int | None] = mapped_column(Integer, nullable=True)
    repetitions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    intensity: Mapped[Intensity] = mapped_column(enum_col(Intensity), default=Intensity.MEDIUM)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[ExerciseStatus] = mapped_column(enum_col(ExerciseStatus), default=ExerciseStatus.TODO)
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    plan: Mapped[TrainingPlan] = relationship(back_populates="exercises")
