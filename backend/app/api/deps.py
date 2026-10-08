"""Authentication & role-based authorization dependencies."""
import uuid
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_token
from app.domain.enums import UserRole
from app.infrastructure.db.models import Coach, Student, User
from app.infrastructure.db.session import get_db

bearer = HTTPBearer(auto_error=False)
DB = Annotated[Session, Depends(get_db)]


def get_current_actor(db: DB, creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> Actor:
    if creds is None:
        raise AuthenticationError("Not authenticated")
    try:
        payload = decode_token(creds.credentials)
    except Exception:
        raise AuthenticationError("Invalid or expired token", code="invalid_token")
    if payload.get("type") != "access":
        raise AuthenticationError("Invalid token type", code="invalid_token")
    user = db.get(User, uuid.UUID(payload["sub"]))
    if not user or not user.is_active:
        raise AuthenticationError("User not found", code="invalid_token")
    actor = Actor(user=user)
    if user.role == UserRole.COACH:
        actor.coach = db.scalar(select(Coach).where(Coach.user_id == user.id))
    elif user.role == UserRole.STUDENT:
        actor.student_ids = list(db.scalars(select(Student.id).where(
            Student.user_id == user.id, Student.deleted_at.is_(None))))
    return actor


CurrentActor = Annotated[Actor, Depends(get_current_actor)]


def require_coach(actor: CurrentActor) -> Actor:
    if actor.role != UserRole.COACH or actor.coach is None:
        raise PermissionDeniedError("Coach access only")
    return actor


def require_student(actor: CurrentActor) -> Actor:
    if actor.role != UserRole.STUDENT:
        raise PermissionDeniedError("Student access only")
    return actor


CoachActor = Annotated[Actor, Depends(require_coach)]
StudentActor = Annotated[Actor, Depends(require_student)]
