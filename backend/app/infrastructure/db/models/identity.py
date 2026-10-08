import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums import UserRole
from app.infrastructure.db.base import Base, TimestampMixin, UUIDPkMixin
from app.infrastructure.db.types import UTCDateTime


def enum_col(enum_cls, **kw):
    return Enum(enum_cls, native_enum=False, length=32, values_callable=lambda e: [m.value for m in e], **kw)


class User(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "users"

    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(enum_col(UserRole), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    locale: Mapped[str] = mapped_column(String(8), default="fa")
    last_login_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)

    coach_profile: Mapped["Coach | None"] = relationship(back_populates="user", uselist=False)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class Academy(UUIDPkMixin, TimestampMixin, Base):
    """Reserved for multi-coach academies / clubs / branches (future)."""

    __tablename__ = "academies"

    name: Mapped[str] = mapped_column(String(160))
    owner_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))


class Coach(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "coaches"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    academy_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("academies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Tehran")
    currency: Mapped[str] = mapped_column(String(8), default="IRT")
    # {"charge_rules": {"excused": false, ...}, "reminder_hours": 3, "calendar": "jalali"}
    settings: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped[User] = relationship(back_populates="coach_profile")


class RefreshToken(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    jti: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)


class DeviceToken(UUIDPkMixin, TimestampMixin, Base):
    """Expo / FCM / APNs push tokens."""

    __tablename__ = "device_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token: Mapped[str] = mapped_column(String(255), unique=True)
    platform: Mapped[str] = mapped_column(String(16), default="android")
