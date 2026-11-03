import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.application.schemas.common import ORMModel


class NotificationOut(ORMModel):
    id: uuid.UUID
    type: str
    title: str
    body: str | None
    data: dict
    is_read: bool
    created_at: datetime


class DeviceTokenIn(BaseModel):
    token: str = Field(min_length=10, max_length=255)
    platform: str = Field(default="android", pattern="^(android|ios|web)$")


class CoachSettingsIn(BaseModel):
    charge_rules: dict[str, bool] | None = None
    reminder_hours: int | None = Field(default=None, ge=1, le=72)
    timezone: str | None = None
    bio: str | None = None
