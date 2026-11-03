"""Thin repository helpers enforcing tenant (coach) scoping on every query."""
import uuid
from typing import TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError

M = TypeVar("M")


class Repository:
    def __init__(self, db: Session):
        self.db = db

    def get_owned(self, model: type[M], obj_id: uuid.UUID, coach_id: uuid.UUID, *, include_deleted=False) -> M:
        stmt = select(model).where(model.id == obj_id, model.coach_id == coach_id)
        if hasattr(model, "deleted_at") and not include_deleted:
            stmt = stmt.where(model.deleted_at.is_(None))
        obj = self.db.scalar(stmt)
        if obj is None:
            raise NotFoundError(f"{model.__name__} not found")
        return obj

    def add(self, obj):
        self.db.add(obj)
        return obj
