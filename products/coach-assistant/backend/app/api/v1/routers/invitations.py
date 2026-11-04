import uuid

from fastapi import APIRouter, Query, Response

from app.api.deps import DB, CoachActor, CurrentActor
from app.application.schemas.students import (
    AcceptInvitationIn, CoachInvitationCreate, CoachInvitationOut, CoachInvitationPreview,
)
from app.application.services.invitation_service import InvitationService
from app.domain.enums import InvitationChannel

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.post("", response_model=CoachInvitationOut, status_code=201)
def create_invitation(data: CoachInvitationCreate, actor: CoachActor, db: DB):
    return InvitationService(db).create(actor, data)


@router.get("/student/{student_id}", response_model=CoachInvitationOut | None)
def get_student_invitation(student_id: uuid.UUID, actor: CoachActor, db: DB):
    return InvitationService(db).get_active_for_student(actor, student_id)


@router.post("/{invitation_id}/cancel", status_code=204)
def cancel_invitation(invitation_id: uuid.UUID, actor: CoachActor, db: DB):
    InvitationService(db).cancel(actor, invitation_id)
    return Response(status_code=204)


@router.post("/{invitation_id}/channel", response_model=CoachInvitationOut)
def update_invitation_channel(invitation_id: uuid.UUID, channel: InvitationChannel, actor: CoachActor, db: DB):
    return InvitationService(db).update_channel(actor, invitation_id, channel)


@router.get("/preview", response_model=CoachInvitationPreview)
def preview_invitation(code: str = Query(..., min_length=3, max_length=16), db: DB = None):
    return InvitationService(db).preview_by_code(code)


@router.post("/accept")
def accept_invitation(data: AcceptInvitationIn, actor: CurrentActor, db: DB):
    return InvitationService(db).accept(actor, data)
