import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.application.schemas.common import ORMModel, Phone
from app.domain.enums import UserRole


class RegisterIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: Phone
    password: str = Field(min_length=8, max_length=128)
    role: UserRole

    @field_validator("role")
    @classmethod
    def no_admin(cls, v: UserRole) -> UserRole:
        if v == UserRole.ADMIN:
            raise ValueError("admin registration is not allowed")
        return v

    @field_validator("password")
    @classmethod
    def strong(cls, v: str) -> str:
        if not any(c.isdigit() for c in v) or not any(c.isalpha() for c in v):
            raise ValueError("password must contain letters and digits")
        return v

    @field_validator("email")
    @classmethod
    def lower(cls, v: str) -> str:
        return v.lower()


class LoginIn(BaseModel):
    identifier: str = Field(min_length=3, max_length=255, description="email or phone")
    password: str = Field(min_length=1, max_length=128)


class RefreshIn(BaseModel):
    refresh_token: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UserOut(ORMModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: str
    role: UserRole
    locale: str
    has_active_subscription: bool = False
    subscription_expires_at: datetime | None = None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut
