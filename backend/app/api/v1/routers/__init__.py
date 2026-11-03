from fastapi import APIRouter

from app.api.v1.routers import (
    auth, classes, finance, invitations, me, sessions, students, subscriptions, training,
)
from app.apps.coach_wallet.router import router as wallet_router
from app.apps.payments_gateway.router import router as payments_gateway_router
from app.apps.ai_engine.router import router as ai_engine_router

api_router = APIRouter()
for r in (auth, students, invitations, classes, sessions, finance, training, me, subscriptions):
    api_router.include_router(r.router)

# Mount modular apps
api_router.include_router(wallet_router)
api_router.include_router(payments_gateway_router)
api_router.include_router(ai_engine_router)
