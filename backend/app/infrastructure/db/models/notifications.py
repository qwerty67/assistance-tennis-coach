import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums import NotificationType
from app.infrastructure.db.base import Base, TimestampMixin, UUIDPkMixin
from app.infrastructure.db.models.identity import enum_col
from app.infrastructure.db.types import UTCDateTime


class Notification(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_user_read", "user_id", "is_read"),)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[NotificationType] = mapped_column(enum_col(NotificationType))
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict)  # used by the client for i18n + deep links
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    push_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    dedupe_key: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
