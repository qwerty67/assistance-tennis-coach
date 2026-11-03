from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums import SubscriptionStatus, SubscriptionTier
from app.infrastructure.db.base import Base, TimestampMixin, UUIDPkMixin
from app.infrastructure.db.models.identity import enum_col
from app.infrastructure.db.types import UTCDateTime


class CoachSubscription(UUIDPkMixin, TimestampMixin, Base):
    """Subscription record for a coach specifying access plan and active validity period."""

    __tablename__ = "coach_subscriptions"

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    tier: Mapped[SubscriptionTier] = mapped_column(enum_col(SubscriptionTier))
    title: Mapped[str] = mapped_column(String(100))
    duration_days: Mapped[int] = mapped_column(Integer)
    price: Mapped[int] = mapped_column(BigInteger)
    status: Mapped[SubscriptionStatus] = mapped_column(
        enum_col(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, index=True
    )
    starts_at: Mapped[datetime] = mapped_column(UTCDateTime)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime, index=True)
    payment_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True, default="mock")

    coach: Mapped["Coach"] = relationship("Coach", back_populates="subscriptions")  # noqa: F821
