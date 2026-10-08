import uuid

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.domain.enums import NotificationType
from app.infrastructure.db.models import DeviceToken, Notification, Student
from app.infrastructure.db.types import utcnow
from app.infrastructure.notifications.push import get_push_gateway


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.push = get_push_gateway()

    def notify_user(self, user_id: uuid.UUID, ntype: NotificationType, title: str, body: str = "",
                    data: dict | None = None, dedupe_key: str | None = None) -> Notification | None:
        if dedupe_key and self.db.scalar(select(Notification.id).where(Notification.dedupe_key == dedupe_key)):
            return None
        n = Notification(user_id=user_id, type=ntype, title=title, body=body, data=data or {}, dedupe_key=dedupe_key)
        self.db.add(n)
        tokens = list(self.db.scalars(select(DeviceToken.token).where(DeviceToken.user_id == user_id)))
        if tokens:
            self.push.send(tokens, title, body, {"type": ntype.value, **(data or {})})
            n.push_sent = True
        return n

    def notify_students(self, students: list[Student], ntype: NotificationType, title: str, body: str = "",
                        data: dict | None = None, dedupe_prefix: str | None = None) -> int:
        count = 0
        for s in students:
            if s.user_id:
                key = f"{dedupe_prefix}:{s.id}" if dedupe_prefix else None
                if self.notify_user(s.user_id, ntype, title, body, data, key):
                    count += 1
        return count

    # ---- inbox -----------------------------------------------------------
    def list(self, user_id: uuid.UUID, unread_only=False, limit=50) -> list[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
        return list(self.db.scalars(stmt.order_by(Notification.created_at.desc()).limit(limit)))

    def unread_count(self, user_id: uuid.UUID) -> int:
        return self.db.scalar(
            select(func.count()).select_from(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        ) or 0

    def mark_read(self, user_id: uuid.UUID, notification_id: uuid.UUID) -> None:
        n = self.db.get(Notification, notification_id)
        if not n or n.user_id != user_id:
            raise NotFoundError("Notification not found")
        n.is_read, n.read_at = True, utcnow()
        self.db.commit()

    def mark_all_read(self, user_id: uuid.UUID) -> None:
        self.db.execute(update(Notification).where(Notification.user_id == user_id, Notification.is_read.is_(False))
                        .values(is_read=True, read_at=utcnow()))
        self.db.commit()

    def register_device(self, user_id: uuid.UUID, token: str, platform: str) -> None:
        existing = self.db.scalar(select(DeviceToken).where(DeviceToken.token == token))
        if existing:
            existing.user_id, existing.platform = user_id, platform
        else:
            self.db.add(DeviceToken(user_id=user_id, token=token, platform=platform))
        self.db.commit()
