import uuid

from sqlalchemy import or_, select, update
from sqlalchemy.orm import Session

from app.application.schemas.auth import ChangePasswordIn, LoginIn, RegisterIn, TokenPair, UserOut
from app.application.schemas.common import normalize_phone
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    create_access_token, create_refresh_token, decode_token, hash_password, verify_password,
)
from app.domain.enums import RelationshipStatus, UserRole
from app.infrastructure.db.models import Coach, CoachStudentRelationship, RefreshToken, Student, User
from app.infrastructure.db.types import utcnow


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    # ---- helpers ---------------------------------------------------------
    def _issue(self, user: User) -> TokenPair:
        access = create_access_token(user.id, user.role.value)
        refresh, jti, exp = create_refresh_token(user.id)
        self.db.add(RefreshToken(user_id=user.id, jti=jti, expires_at=exp))
        self.db.commit()
        return TokenPair(
            access_token=access,
            refresh_token=refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserOut.model_validate(user),
        )

    def link_student_profiles(self, user: User) -> int:
        """Attach coach-created student records that match this user's email/phone, synchronizing real identity."""
        students = self.db.scalars(
            select(Student)
            .where(Student.user_id.is_(None), Student.deleted_at.is_(None))
            .where(or_(Student.email == user.email, Student.phone == user.phone))
        ).all()
        for s in students:
            s.user_id = user.id
            s.first_name = user.first_name
            s.last_name = user.last_name
            rel = self.db.scalar(
                select(CoachStudentRelationship).where(
                    CoachStudentRelationship.coach_id == s.coach_id,
                    CoachStudentRelationship.student_id == s.id,
                )
            )
            if not rel:
                self.db.add(
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
        return len(students)

    # ---- use cases -------------------------------------------------------
    def register(self, data: RegisterIn) -> TokenPair:
        exists = self.db.scalar(select(User).where(or_(User.email == data.email, User.phone == data.phone)))
        if exists:
            raise ConflictError("Email or phone already registered", code="user_exists")
        user = User(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=data.email,
            phone=data.phone,
            password_hash=hash_password(data.password),
            role=data.role,
        )
        self.db.add(user)
        self.db.flush()
        if data.role == UserRole.COACH:
            self.db.add(Coach(user_id=user.id, timezone=settings.DEFAULT_TIMEZONE, settings={}))
        else:
            self.link_student_profiles(user)
        self.db.commit()
        return self._issue(user)

    def login(self, data: LoginIn) -> TokenPair:
        ident = data.identifier.strip().lower()
        if "@" not in ident:
            try:
                ident = normalize_phone(ident)
            except ValueError:
                raise AuthenticationError("Invalid credentials", code="invalid_credentials")
        user = self.db.scalar(select(User).where(or_(User.email == ident, User.phone == ident)))
        if not user or not verify_password(data.password, user.password_hash):
            raise AuthenticationError("Invalid credentials", code="invalid_credentials")
        if not user.is_active:
            raise AuthenticationError("Account disabled", code="account_disabled")
        user.last_login_at = utcnow()
        if user.role == UserRole.STUDENT:
            self.link_student_profiles(user)
        return self._issue(user)

    def refresh(self, token: str) -> TokenPair:
        try:
            payload = decode_token(token)
        except Exception:
            raise AuthenticationError("Invalid refresh token", code="invalid_token")
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid refresh token", code="invalid_token")
        stored = self.db.scalar(select(RefreshToken).where(RefreshToken.jti == payload.get("jti")))
        if not stored or stored.revoked_at is not None:
            raise AuthenticationError("Refresh token revoked", code="invalid_token")
        user = self.db.get(User, uuid.UUID(payload["sub"]))
        if not user or not user.is_active:
            raise AuthenticationError("User not found", code="invalid_token")
        stored.revoked_at = utcnow()  # rotation
        return self._issue(user)

    def logout(self, token: str) -> None:
        try:
            payload = decode_token(token)
        except Exception:
            return
        stored = self.db.scalar(select(RefreshToken).where(RefreshToken.jti == payload.get("jti")))
        if stored and stored.revoked_at is None:
            stored.revoked_at = utcnow()
            self.db.commit()

    def change_password(self, user: User, data: ChangePasswordIn) -> None:
        if not verify_password(data.current_password, user.password_hash):
            raise AuthenticationError("Current password is wrong", code="invalid_credentials")
        user.password_hash = hash_password(data.new_password)
        self.db.execute(
            update(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=utcnow())
        )
        self.db.commit()
