"""Authentication & role-based authorization dependencies."""
import uuid
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_token
from app.domain.enums import RelationshipStatus, UserRole
from app.infrastructure.db.models import Coach, CoachStudentRelationship, Student, User
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
        # Auto-link any unlinked student profiles that match user's phone or email
        if user.phone or user.email:
            conds = []
            if user.phone:
                conds.append(Student.phone == user.phone)
            if user.email:
                conds.append(Student.email == user.email)
            unlinked = db.scalars(
                select(Student).where(
                    Student.user_id.is_(None),
                    Student.deleted_at.is_(None),
                    or_(*conds)
                )
            ).all()
            for s in unlinked:
                s.user_id = user.id
                if not s.first_name:
                    s.first_name = user.first_name
                if not s.last_name:
                    s.last_name = user.last_name
                rel = db.scalar(
                    select(CoachStudentRelationship).where(
                        CoachStudentRelationship.coach_id == s.coach_id,
                        CoachStudentRelationship.student_id == s.id,
                    )
                )
                if not rel:
                    db.add(
                        CoachStudentRelationship(
                            id=uuid.uuid4(),
                            coach_id=s.coach_id,
                            student_id=s.id,
                            status=RelationshipStatus.ACTIVE,
                            is_primary=True,
                        )
                    )
                else:
                    rel.status = RelationshipStatus.ACTIVE
            if unlinked:
                db.flush()

        direct_ids = list(db.scalars(
            select(Student.id).where(
                Student.user_id == user.id, Student.deleted_at.is_(None)
            )
        ).all())
        rel_ids = list(db.scalars(
            select(CoachStudentRelationship.student_id)
            .join(Student, Student.id == CoachStudentRelationship.student_id)
            .where(
                Student.user_id == user.id,
                Student.deleted_at.is_(None),
                CoachStudentRelationship.status == RelationshipStatus.ACTIVE,
            )
        ).all())
        actor.student_ids = list(dict.fromkeys(direct_ids + rel_ids))
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
