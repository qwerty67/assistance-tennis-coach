from typing import Optional
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=80)
    last_name: str = Field(..., min_length=1, max_length=80)
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = None
    password: str = Field(..., min_length=6, max_length=128)
    role: str = "COACH"


class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = "COACH"

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    identifier: Optional[str] = None
    username: Optional[str] = None
    password: str

    @property
    def login_identifier(self) -> str:
        return (self.identifier or self.username or "").strip()


class TokenPair(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse
