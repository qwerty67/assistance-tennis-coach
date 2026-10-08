import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.application.schemas.training import ExerciseIn, ExerciseUpdate, PlanCreate, PlanUpdate
from app.application.services.notification_service import NotificationService
from app.core.exceptions import NotFoundError
from app.domain.enums import ExerciseStatus, NotificationType
from app.infrastructure.db.models import Student, TrainingExercise, TrainingPlan
from app.infrastructure.db.types import utcnow
from app.infrastructure.repositories.base import Repository

SKILL_CATALOG = {
    "technical": ["forehand", "backhand", "serve", "volley", "slice", "drop_shot", "return", "footwork"],
    "tactical": ["cross_court", "down_the_line", "serve_plus_one", "return_plus_one", "attack", "defense", "transition"],
    "mental": ["stress_control", "focus", "error_management", "emotion_control", "pre_serve_routine"],
    "fitness": ["endurance", "speed", "agility", "strength", "flexibility", "core"],
}


class TrainingService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = Repository(db)

    def to_out(self, p: TrainingPlan) -> dict:
        st = self.db.get(Student, p.student_id)
        ex = list(p.exercises)
        done = sum(1 for e in ex if e.status == ExerciseStatus.DONE)
        return {**{k: getattr(p, k) for k in ("id", "student_id", "title", "description", "start_date", "end_date",
                                              "status", "created_at")},
                "student_name": st.full_name if st else None, "exercises": ex,
                "progress": round(done / len(ex), 2) if ex else 0}

    def _get(self, actor: Actor, plan_id: uuid.UUID) -> TrainingPlan:
        if actor.coach:
            return self.repo.get_owned(TrainingPlan, plan_id, actor.coach_id)
        p = self.db.get(TrainingPlan, plan_id)
        if not p or p.deleted_at or p.student_id not in actor.student_ids:
            raise NotFoundError("Training plan not found")
        return p

    def list(self, actor: Actor, student_id=None) -> list[dict]:
        stmt = select(TrainingPlan).where(TrainingPlan.deleted_at.is_(None))
        if actor.coach:
            stmt = stmt.where(TrainingPlan.coach_id == actor.coach_id)
        else:
            stmt = stmt.where(TrainingPlan.student_id.in_(actor.student_ids or [uuid.uuid4()]))
        if student_id:
            stmt = stmt.where(TrainingPlan.student_id == student_id)
        return [self.to_out(p) for p in self.db.scalars(stmt.order_by(TrainingPlan.created_at.desc()))]

    def get(self, actor: Actor, plan_id: uuid.UUID) -> dict:
        return self.to_out(self._get(actor, plan_id))

    def create(self, actor: Actor, data: PlanCreate) -> dict:
        st = self.repo.get_owned(Student, data.student_id, actor.coach_id)
        p = TrainingPlan(coach_id=actor.coach_id, **data.model_dump(exclude={"exercises"}))
        p.exercises = [TrainingExercise(**e.model_dump()) for e in data.exercises]
        self.db.add(p)
        self.db.flush()
        NotificationService(self.db).notify_students([st], NotificationType.TRAINING_PLAN, "برنامه تمرینی جدید",
                                                    p.title, {"plan_id": str(p.id)})
        self.db.commit()
        return self.to_out(p)

    def update(self, actor: Actor, plan_id: uuid.UUID, data: PlanUpdate) -> dict:
        p = self._get(actor, plan_id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(p, k, v)
        p.version += 1
        self.db.commit()
        return self.to_out(p)

    def delete(self, actor: Actor, plan_id: uuid.UUID) -> None:
        p = self._get(actor, plan_id)
        p.deleted_at = utcnow()
        self.db.commit()

    def add_exercise(self, actor: Actor, plan_id: uuid.UUID, data: ExerciseIn) -> dict:
        p = self._get(actor, plan_id)
        p.exercises.append(TrainingExercise(**data.model_dump()))
        self.db.commit()
        return self.to_out(p)

    def update_exercise(self, actor: Actor, plan_id: uuid.UUID, ex_id: uuid.UUID, data: ExerciseUpdate) -> dict:
        p = self._get(actor, plan_id)
        e = next((e for e in p.exercises if e.id == ex_id), None)
        if not e:
            raise NotFoundError("Exercise not found")
        payload = data.model_dump(exclude_unset=True)
        if not actor.coach:  # students may only update completion status
            payload = {k: v for k, v in payload.items() if k == "status"}
        for k, v in payload.items():
            setattr(e, k, v)
        if "status" in payload:
            e.completed_at = utcnow() if e.status == ExerciseStatus.DONE else None
        self.db.commit()
        return self.to_out(p)

    def delete_exercise(self, actor: Actor, plan_id: uuid.UUID, ex_id: uuid.UUID) -> dict:
        p = self._get(actor, plan_id)
        p.exercises = [e for e in p.exercises if e.id != ex_id]
        self.db.commit()
        return self.to_out(p)
