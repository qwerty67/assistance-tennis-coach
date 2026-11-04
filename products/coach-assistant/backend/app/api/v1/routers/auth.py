from fastapi import APIRouter, Depends

from app.api.deps import DB, CurrentActor
from app.application.schemas.auth import (
    ChangePasswordIn, LoginIn, RefreshIn, RegisterIn, TokenPair, UserOut,
)
from app.application.schemas.common import Message
from app.application.services.auth_service import AuthService
from app.core.rate_limit import rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair, status_code=201, dependencies=[Depends(rate_limit())])
def register(data: RegisterIn, db: DB):
    return AuthService(db).register(data)


@router.post("/login", response_model=TokenPair, dependencies=[Depends(rate_limit())])
def login(data: LoginIn, db: DB):
    return AuthService(db).login(data)


@router.post("/refresh", response_model=TokenPair, dependencies=[Depends(rate_limit(limit=30))])
def refresh(data: RefreshIn, db: DB):
    return AuthService(db).refresh(data.refresh_token)


@router.post("/logout", response_model=Message)
def logout(data: RefreshIn, db: DB):
    AuthService(db).logout(data.refresh_token)
    return Message(message="ok")


@router.get("/me", response_model=UserOut)
def me(actor: CurrentActor):
    return actor.user


@router.post("/change-password", response_model=Message, dependencies=[Depends(rate_limit(limit=5))])
def change_password(data: ChangePasswordIn, actor: CurrentActor, db: DB):
    AuthService(db).change_password(actor.user, data)
    return Message(message="ok")
