from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.deps import DB, CoachActor
from app.application.schemas.subscription import (
    SubscribeIn,
    SubscribeResultOut,
    SubscriptionPlanOut,
    SubscriptionStatusOut,
)
from app.application.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/plans", response_model=list[SubscriptionPlanOut])
def list_plans(db: DB):
    """Retrieve available subscription plans for coaches."""
    return SubscriptionService(db).list_plans()


@router.get("/current", response_model=SubscriptionStatusOut)
def current_subscription(actor: CoachActor, db: DB):
    """Get active subscription status for the current authenticated coach."""
    return SubscriptionService(db).get_current_subscription(actor)


@router.post("/subscribe", response_model=SubscribeResultOut, status_code=status.HTTP_201_CREATED)
def subscribe(data: SubscribeIn, actor: CoachActor, db: DB):
    """Subscribe to a plan or extend existing active subscription."""
    return SubscriptionService(db).subscribe(actor, data)
