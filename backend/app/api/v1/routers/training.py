import uuid

from fastapi import APIRouter, Response

from app.api.deps import DB, CoachActor, CurrentActor
from app.application.schemas.training import ExerciseIn, ExerciseUpdate, PlanCreate, PlanOut, PlanUpdate
from app.application.services.training_service import SKILL_CATALOG, TrainingService

router = APIRouter(prefix="/training-plans", tags=["training"])


@router.get("/catalog")
def catalog(actor: CurrentActor):
    return SKILL_CATALOG


@router.get("", response_model=list[PlanOut])
def list_plans(actor: CurrentActor, db: DB, student_id: uuid.UUID | None = None):
    return TrainingService(db).list(actor, student_id if actor.coach else None)


@router.post("", response_model=PlanOut, status_code=201)
def create_plan(data: PlanCreate, actor: CoachActor, db: DB):
    return TrainingService(db).create(actor, data)


@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: uuid.UUID, actor: CurrentActor, db: DB):
    return TrainingService(db).get(actor, plan_id)


@router.put("/{plan_id}", response_model=PlanOut)
def update_plan(plan_id: uuid.UUID, data: PlanUpdate, actor: CoachActor, db: DB):
    return TrainingService(db).update(actor, plan_id, data)


@router.delete("/{plan_id}", status_code=204)
def delete_plan(plan_id: uuid.UUID, actor: CoachActor, db: DB):
    TrainingService(db).delete(actor, plan_id)
    return Response(status_code=204)


@router.post("/{plan_id}/exercises", response_model=PlanOut, status_code=201)
def add_exercise(plan_id: uuid.UUID, data: ExerciseIn, actor: CoachActor, db: DB):
    return TrainingService(db).add_exercise(actor, plan_id, data)


@router.patch("/{plan_id}/exercises/{exercise_id}", response_model=PlanOut)
def update_exercise(plan_id: uuid.UUID, exercise_id: uuid.UUID, data: ExerciseUpdate, actor: CurrentActor, db: DB):
    """Coach can edit everything; a student can only change the completion status of his own plan."""
    return TrainingService(db).update_exercise(actor, plan_id, exercise_id, data)


@router.delete("/{plan_id}/exercises/{exercise_id}", response_model=PlanOut)
def delete_exercise(plan_id: uuid.UUID, exercise_id: uuid.UUID, actor: CoachActor, db: DB):
    return TrainingService(db).delete_exercise(actor, plan_id, exercise_id)
