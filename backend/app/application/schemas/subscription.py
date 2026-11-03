from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.enums import SubscriptionStatus, SubscriptionTier


class SubscriptionPlanOut(BaseModel):
    id: str
    tier: SubscriptionTier
    title: str
    duration_days: int
    duration_months: int
    price: int
    original_price: int
    discount_percent: int
    is_popular: bool = False
    badge: str | None = None
    features: list[str] = Field(default_factory=list)


class SubscriptionStatusOut(BaseModel):
    is_active: bool
    tier: SubscriptionTier | None = None
    title: str | None = None
    starts_at: datetime | None = None
    expires_at: datetime | None = None
    days_left: int | None = None
    payment_reference: str | None = None
    status: SubscriptionStatus | None = None


class SubscribeIn(BaseModel):
    plan_tier: SubscriptionTier
    payment_method: str = "mock_gateway"


class SubscribeResultOut(BaseModel):
    success: bool
    subscription: SubscriptionStatusOut
    message: str
