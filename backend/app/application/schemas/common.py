import re
import uuid
from datetime import datetime
from typing import Annotated, Generic, TypeVar

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

T = TypeVar("T")

_FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


def normalize_phone(v: str) -> str:
    v = v.translate(_FA_DIGITS)
    v = re.sub(r"[\s\-()]", "", v)
    if not re.fullmatch(r"\+?\d{8,15}", v):
        raise ValueError("invalid phone number")
    if v.startswith("+98"):
        v = "0" + v[3:]
    elif v.startswith("98") and len(v) == 12:
        v = "0" + v[2:]
    return v


Phone = Annotated[str, AfterValidator(normalize_phone)]
Money = Annotated[int, Field(ge=0, le=10**13)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int


class IdOut(ORMModel):
    id: uuid.UUID


class Message(BaseModel):
    message: str


class TimestampedOut(ORMModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
