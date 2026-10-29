from __future__ import annotations
import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.application.schemas.students import (
    AcceptInvitationIn, CoachInvitationCreate, CoachInvitationOut, CoachInvitationPreview,
)
from app.core.exceptions import AppError, ConflictError, NotFoundError
from app.domain.enums import (
    InvitationChannel, InvitationStatus, NotificationType, RelationshipStatus, StudentStatus, UserRole,
)
from app.infrastructure.db.models import (
    Coach, CoachInvitation, CoachStudentRelationship, Notification, Student, User,
)
from app.infrastructure.db.types import utcnow


def generate_invite_code() -> str:
    chars = string.ascii_uppercase.replace("O", "").replace("I", "") + string.digits.replace("0", "").replace("1", "")
    part = "".join(secrets.choice(chars) for _ in range(6))
    return f"TC-{part}"


class InvitationService:
    def __init__(self, db: Session):
        self.db = db

    def _inv_to_out(self, inv: CoachInvitation) -> dict:
        return {
            "id": inv.id,
            "coach_id": inv.coach_id,
            "student_id": inv.student_id,
            "phone": inv.phone,
            "code": inv.code,
            "token": inv.token,
            "invite_url": f"https://tennis.arvateam.ir/join?code={inv.code}",
            "status": inv.status,
            "channel": inv.channel,
            "expires_at": inv.expires_at,
            "created_at": inv.created_at,
        }

    def create(self, actor: Actor, data: CoachInvitationCreate) -> dict:
        cid = actor.coach_id
        # Cancel any previous pending invitation for this student/phone to prevent duplicates
        if data.student_id:
            old_invs = self.db.scalars(
                select(CoachInvitation).where(
                    CoachInvitation.coach_id == cid,
                    CoachInvitation.student_id == data.student_id,
                    CoachInvitation.status.in_([InvitationStatus.CREATED, InvitationStatus.SENT]),
                )
            ).all()
            for old in old_invs:
                old.status = InvitationStatus.CANCELLED

        code = generate_invite_code()
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=data.expires_in_days)

        inv = CoachInvitation(
            id=uuid.uuid4(),
            coach_id=cid,
            student_id=data.student_id,
            phone=data.phone,
            code=code,
            token=token,
            status=InvitationStatus.CREATED,
            channel=data.channel,
            expires_at=expires_at,
        )
        self.db.add(inv)
        self.db.commit()
        self.db.refresh(inv)
        return self._inv_to_out(inv)

    def get_active_for_student(self, actor: Actor, student_id: uuid.UUID) -> dict | None:
        cid = actor.coach_id
        now = datetime.now(timezone.utc)
        inv = self.db.scalar(
            select(CoachInvitation).where(
                CoachInvitation.coach_id == cid,
                CoachInvitation.student_id == student_id,
                CoachInvitation.status.in_([InvitationStatus.CREATED, InvitationStatus.SENT]),
                CoachInvitation.expires_at > now,
            ).order_by(CoachInvitation.created_at.desc())
        )
        return self._inv_to_out(inv) if inv else None

    def cancel(self, actor: Actor, invitation_id: uuid.UUID) -> None:
        inv = self.db.get(CoachInvitation, invitation_id)
        if not inv or inv.coach_id != actor.coach_id:
            raise NotFoundError("Invitation not found")
        inv.status = InvitationStatus.CANCELLED
        self.db.commit()

    def update_channel(self, actor: Actor, invitation_id: uuid.UUID, channel: InvitationChannel) -> dict:
        inv = self.db.get(CoachInvitation, invitation_id)
        if not inv or inv.coach_id != actor.coach_id:
            raise NotFoundError("Invitation not found")
        inv.channel = channel
        inv.status = InvitationStatus.SENT
        self.db.commit()
        self.db.refresh(inv)
        return self._inv_to_out(inv)

    def preview_by_code(self, code: str) -> dict:
        clean_code = code.strip().upper()
        now = datetime.now(timezone.utc)
        inv = self.db.scalar(
            select(CoachInvitation).where(
                CoachInvitation.code == clean_code,
                CoachInvitation.status.in_([InvitationStatus.CREATED, InvitationStatus.SENT]),
                CoachInvitation.expires_at > now,
            )
        )
        if not inv:
            raise NotFoundError("Invalid or expired invitation code", code="invalid_invite_code")
        coach = self.db.get(Coach, inv.coach_id)
        if not coach or not coach.user:
            raise NotFoundError("Coach not found")

        return {
            "code": inv.code,
            "coach_id": coach.id,
            "coach_name": coach.user.full_name,
            "coach_bio": coach.bio,
            "coach_phone": coach.user.phone,
        }

    def accept(self, actor: Actor, data: AcceptInvitationIn) -> dict:
        if actor.user.role != UserRole.STUDENT:
            raise AppError("Only students can accept coach invitations", code="student_only")

        clean_code = data.code.strip().upper()
        now = datetime.now(timezone.utc)
        inv = self.db.scalar(
            select(CoachInvitation).where(
                CoachInvitation.code == clean_code,
                CoachInvitation.status.in_([InvitationStatus.CREATED, InvitationStatus.SENT]),
                CoachInvitation.expires_at > now,
            )
        )
        if not inv:
            raise NotFoundError("Invalid or expired invitation code", code="invalid_invite_code")

        coach = self.db.get(Coach, inv.coach_id)
        if not coach:
            raise NotFoundError("Coach not found")
        if coach.user_id == actor.user.id:
            raise ConflictError("Cannot connect to yourself", code="self_invite")

        # 1. Determine or link Student record
        student: Student | None = None
        if inv.student_id:
            student = self.db.get(Student, inv.student_id)
            if student:
                student.user_id = actor.user.id
                # Business Rule: True student account identity overrides temporary local name
                student.first_name = actor.user.first_name
                student.last_name = actor.user.last_name
                if not student.phone and actor.user.phone:
                    student.phone = actor.user.phone
                if not student.email and actor.user.email:
                    student.email = actor.user.email
        if not student:
            # Check if student record with actor's phone already exists for this coach
            student = self.db.scalar(
                select(Student).where(
                    Student.coach_id == coach.id,
                    or_(Student.user_id == actor.user.id, Student.phone == actor.user.phone),
                    Student.deleted_at.is_(None),
                )
            )
            if student:
                student.user_id = actor.user.id
                student.first_name = actor.user.first_name
                student.last_name = actor.user.last_name
        if not student:
            # Create local student record for this coach linked to user
            from app.infrastructure.db.models import FinancialAccount
            student = Student(
                id=uuid.uuid4(),
                coach_id=coach.id,
                user_id=actor.user.id,
                first_name=actor.user.first_name,
                last_name=actor.user.last_name,
                phone=actor.user.phone,
                email=actor.user.email,
                start_date=actor.today(),
                status=StudentStatus.ACTIVE,
            )
            self.db.add(student)
            self.db.flush()
            self.db.add(FinancialAccount(student_id=student.id, coach_id=coach.id))

        # 2. Check / update CoachStudentRelationship
        rel = self.db.scalar(
            select(CoachStudentRelationship).where(
                CoachStudentRelationship.coach_id == coach.id,
                CoachStudentRelationship.student_id == student.id,
            )
        )
        if not rel:
            rel = CoachStudentRelationship(
                id=uuid.uuid4(),
                coach_id=coach.id,
                student_id=student.id,
                status=RelationshipStatus.ACTIVE,
                is_primary=False,
                responded_at=now,
            )
            self.db.add(rel)
        else:
            rel.status = RelationshipStatus.ACTIVE
            rel.responded_at = now
            rel.deactivated_at = None

        # 3. Handle primary coach selection
        if data.set_as_primary:
            # Set is_primary to False for all other relationships of this student
            all_rels = self.db.scalars(
                select(CoachStudentRelationship).where(
                    CoachStudentRelationship.student_id == student.id
                )
            ).all()
            for r in all_rels:
                r.is_primary = False
            rel.is_primary = True

        # 4. Mark invitation used
        inv.status = InvitationStatus.USED
        inv.used_at = now
        inv.used_by_user_id = actor.user.id

        # 5. Notify coach
        self.db.add(
            Notification(
                id=uuid.uuid4(),
                user_id=coach.user_id,
                type=NotificationType.COACH_CONNECTED,
                title="شاگرد جدید متصل شد",
                body=f"شاگرد {actor.user.full_name} با موفقیت به شما متصل شد.",
                data={"student_id": str(student.id), "code": inv.code},
            )
        )

        self.db.commit()
        return {
            "message": "Connected successfully",
            "coach_id": coach.id,
            "coach_name": coach.user.full_name,
            "is_primary": rel.is_primary,
            "student_id": student.id,
        }
