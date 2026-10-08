import uuid

from fastapi import APIRouter, Response

from app.api.deps import DB, CoachActor
from app.application.schemas.classes import (
    ClassCreate, ClassOut, ClassUpdate, MonthlyChargeIn, ScheduleIn, ShareUpdate, TermCreate, TermOut,
    TermUpdate,
)
from app.application.services.class_service import ClassService
from app.application.services.finance_service import FinanceService
from app.application.services.term_service import TermService
from app.domain.enums import ClassType, TermStatus

router = APIRouter(tags=["classes & terms"])


@router.get("/classes", response_model=list[ClassOut])
def list_classes(actor: CoachActor, db: DB, class_type: ClassType | None = None, active: bool | None = None):
    return ClassService(db).list(actor, class_type, active)


@router.post("/classes", response_model=ClassOut, status_code=201)
def create_class(data: ClassCreate, actor: CoachActor, db: DB):
    return ClassService(db).create(actor, data)


@router.get("/classes/{class_id}", response_model=ClassOut)
def get_class(class_id: uuid.UUID, actor: CoachActor, db: DB):
    return ClassService(db).get(actor, class_id)


@router.put("/classes/{class_id}", response_model=ClassOut)
def update_class(class_id: uuid.UUID, data: ClassUpdate, actor: CoachActor, db: DB):
    return ClassService(db).update(actor, class_id, data)


@router.delete("/classes/{class_id}", status_code=204)
def delete_class(class_id: uuid.UUID, actor: CoachActor, db: DB):
    ClassService(db).delete(actor, class_id)
    return Response(status_code=204)


@router.post("/classes/{class_id}/members/{student_id}", response_model=ClassOut)
def add_member(class_id: uuid.UUID, student_id: uuid.UUID, actor: CoachActor, db: DB):
    return ClassService(db).add_member(actor, class_id, student_id)


@router.delete("/classes/{class_id}/members/{student_id}", response_model=ClassOut)
def remove_member(class_id: uuid.UUID, student_id: uuid.UUID, actor: CoachActor, db: DB):
    return ClassService(db).remove_member(actor, class_id, student_id)


# ---------------------------------------------------------------- terms
@router.get("/terms", response_model=list[TermOut])
def list_terms(actor: CoachActor, db: DB, class_id: uuid.UUID | None = None,
               student_id: uuid.UUID | None = None, status: TermStatus | None = None):
    return TermService(db).list(actor, class_id, student_id, status)


@router.post("/terms", response_model=TermOut, status_code=201)
def create_term(data: TermCreate, actor: CoachActor, db: DB):
    """Create a term with members, pricing, auto-generated sessions and receivables in one call."""
    return TermService(db).create(actor, data)


@router.get("/terms/{term_id}", response_model=TermOut)
def get_term(term_id: uuid.UUID, actor: CoachActor, db: DB):
    return TermService(db).get(actor, term_id)


@router.put("/terms/{term_id}", response_model=TermOut)
def update_term(term_id: uuid.UUID, data: TermUpdate, actor: CoachActor, db: DB):
    return TermService(db).update(actor, term_id, data)


@router.delete("/terms/{term_id}", status_code=204)
def delete_term(term_id: uuid.UUID, actor: CoachActor, db: DB):
    TermService(db).delete(actor, term_id)
    return Response(status_code=204)


@router.post("/terms/{term_id}/schedule", response_model=TermOut)
def add_schedule(term_id: uuid.UUID, data: ScheduleIn, actor: CoachActor, db: DB):
    return TermService(db).add_schedule(actor, term_id, data)


@router.put("/terms/{term_id}/members/{student_id}/share", response_model=TermOut)
def update_share(term_id: uuid.UUID, student_id: uuid.UUID, data: ShareUpdate, actor: CoachActor, db: DB):
    return TermService(db).update_share(actor, term_id, student_id, data.share_per_session)


@router.post("/terms/{term_id}/monthly-charges")
def monthly_charges(term_id: uuid.UUID, data: MonthlyChargeIn, actor: CoachActor, db: DB):
    return {"created": FinanceService(db).generate_monthly(actor, term_id, data.period, data.due_date)}
