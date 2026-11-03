import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.application.schemas.common import ORMModel
from app.domain.enums import ExerciseStatus, Intensity, PlanStatus, TrainingCategory


class ExerciseIn(BaseModel):
    category: TrainingCategory
    skill: str | None = Field(default=None, max_length=64)
    title: str = Field(min_length=1, max_length=160)
    description: str | None = None
    sets: int | None = Field(default=None, ge=0)
    repetitions: int | None = Field(default=None, ge=0)
    duration_minutes: int | None = Field(default=None, ge=0)
    intensity: Intensity = Intensity.MEDIUM
    start_date: date | None = None
    end_date: date | None = None
    status: ExerciseStatus = ExerciseStatus.TODO
    order_index: int = 0


class ExerciseUpdate(BaseModel):
    category: TrainingCategory | None = None
    skill: str | None = None
    title: str | None = None
    description: str | None = None
    sets: int | None = None
    repetitions: int | None = None
    duration_minutes: int | None = None
    intensity: Intensity | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: ExerciseStatus | None = None
    order_index: int | None = None


class ExerciseOut(ExerciseIn, ORMModel):
    id: uuid.UUID
    completed_at: datetime | None


class PlanCreate(BaseModel):
    student_id: uuid.UUID
    title: str = Field(min_length=1, max_length=160)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: PlanStatus = PlanStatus.ACTIVE
    exercises: list[ExerciseIn] = []


class PlanUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: PlanStatus | None = None


class PlanOut(ORMModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str | None = None
    title: str
    description: str | None
    start_date: date | None
    end_date: date | None
    status: PlanStatus
    exercises: list[ExerciseOut] = []
    progress: float = 0
    created_at: datetime
