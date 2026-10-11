from fastapi import APIRouter

from app.api.v1.routers import auth, classes, finance, me, sessions, students, subscriptions, training

api_router = APIRouter()
for r in (auth, students, classes, sessions, finance, training, me, subscriptions):
    api_router.include_router(r.router)
