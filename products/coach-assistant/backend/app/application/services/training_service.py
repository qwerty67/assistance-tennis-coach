import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.application.schemas.training import ExerciseIn, ExerciseUpdate, PlanCreate, PlanUpdate
from app.application.services.notification_service import NotificationService
from app.core.exceptions import NotFoundError, ValidationError
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
        self.db.refresh(p)
        exs = sorted(p.exercises, key=lambda e: e.order_index)
        completed = sum(1 for e in exs if e.status == ExerciseStatus.DONE)
        st = self.db.get(Student, p.student_id)
        return {
            "id": p.id, "coach_id": p.coach_id, "student_id": p.student_id,
            "student_name": st.full_name if st else (p.student.full_name if p.student else None),
            "title": p.title, "description": p.description, "status": p.status,
            "start_date": p.start_date, "end_date": p.end_date,
            "total_exercises": len(exs), "completed_exercises": completed,
            "progress": round(completed / len(exs), 2) if exs else 0,
            "exercises": [{
                "id": e.id, "category": e.category, "skill": e.skill, "title": e.title,
                "description": e.description, "sets": e.sets, "repetitions": e.repetitions,
                "duration_minutes": e.duration_minutes, "intensity": e.intensity,
                "start_date": e.start_date, "end_date": e.end_date, "status": e.status,
                "order_index": e.order_index, "completed_at": e.completed_at,
            } for e in exs],
            "version": p.version, "created_at": p.created_at, "updated_at": p.updated_at,
        }

    def _get(self, actor: Actor, plan_id: uuid.UUID) -> TrainingPlan:
        p = self.db.get(TrainingPlan, plan_id)
        if not p or p.deleted_at:
            raise NotFoundError("Plan not found")
        if actor.coach and p.coach_id != actor.coach_id:
            raise NotFoundError("Plan not found")
        if not actor.coach and p.student_id not in (actor.student_ids or []):
            raise NotFoundError("Plan not found")
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
        coach_name = actor.user.full_name
        NotificationService(self.db).notify_students(
            [st],
            NotificationType.TRAINING_PLAN,
            "برنامه تمرینی جدید",
            f"مربی {coach_name} برنامه تمرینی «{p.title}» را برای شما ثبت کرد.",
            {"plan_id": str(p.id), "title": p.title},
        )
        self.db.commit()
        return self.to_out(p)

    def update(self, actor: Actor, plan_id: uuid.UUID, data: PlanUpdate) -> dict:
        p = self._get(actor, plan_id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(p, k, v)
        p.version += 1
        st = self.db.get(Student, p.student_id)
        if st:
            try:
                coach_name = actor.user.full_name
                NotificationService(self.db).notify_students(
                    [st],
                    NotificationType.TRAINING_PLAN,
                    "بروزرسانی برنامه تمرینی",
                    f"مربی {coach_name} برنامه تمرینی «{p.title}» را بروزرسانی کرد.",
                    {"plan_id": str(p.id), "title": p.title},
                )
            except Exception:
                pass
        self.db.commit()
        return self.to_out(p)

    def delete(self, actor: Actor, plan_id: uuid.UUID) -> None:
        p = self._get(actor, plan_id)
        p.deleted_at = utcnow()
        self.db.commit()

    def add_exercise(self, actor: Actor, plan_id: uuid.UUID, data: ExerciseIn) -> dict:
        p = self._get(actor, plan_id)
        p.exercises.append(TrainingExercise(**data.model_dump()))
        st = self.db.get(Student, p.student_id)
        if st:
            try:
                coach_name = actor.user.full_name
                NotificationService(self.db).notify_students(
                    [st],
                    NotificationType.TRAINING_PLAN,
                    "تمرین جدید در برنامه",
                    f"تمرین «{data.title}» به برنامه تمرینی «{p.title}» اضافه شد.",
                    {"plan_id": str(p.id), "title": p.title},
                )
            except Exception:
                pass
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
        if data.status == ExerciseStatus.DONE and not e.completed_at:
            e.completed_at = utcnow()
        elif data.status != ExerciseStatus.DONE:
            e.completed_at = None
        self.db.commit()
        return self.to_out(p)

    def delete_exercise(self, actor: Actor, plan_id: uuid.UUID, ex_id: uuid.UUID) -> dict:
        p = self._get(actor, plan_id)
        e = next((e for e in p.exercises if e.id == ex_id), None)
        if not e:
            raise NotFoundError("Exercise not found")
        p.exercises.remove(e)
        self.db.commit()
        return self.to_out(p)
