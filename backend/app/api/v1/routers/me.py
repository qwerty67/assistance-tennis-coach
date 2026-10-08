"""Endpoints of the logged-in user (dashboards, notifications, settings, sync)."""
import uuid
from datetime import datetime

from fastapi import APIRouter, Response
from sqlalchemy import select

from app.api.deps import DB, CoachActor, CurrentActor, StudentActor
from app.application.schemas.finance import AccountDetailOut, PaymentOut
from app.application.schemas.notifications import CoachSettingsIn, DeviceTokenIn, NotificationOut
from app.application.services.dashboard_service import DashboardService
from app.application.services.finance_service import FinanceService
from app.application.services.notification_service import NotificationService
from app.domain.attendance_rules import DEFAULT_CHARGE_RULES
from app.infrastructure.db.models import Attendance, Payment, Student, TrainingSession

router = APIRouter(tags=["me"])


@router.get("/dashboard/coach")
def coach_dashboard(actor: CoachActor, db: DB):
    return DashboardService(db).coach(actor)


@router.get("/me/dashboard")
def student_dashboard(actor: StudentActor, db: DB):
    return DashboardService(db).student(actor)


@router.get("/me/accounts", response_model=list[AccountDetailOut])
def my_accounts(actor: StudentActor, db: DB):
    fs = FinanceService(db)
    return [fs.account_detail(actor, sid) for sid in actor.student_ids]


@router.get("/me/payments", response_model=list[PaymentOut])
def my_payments(actor: StudentActor, db: DB):
    return FinanceService(db).list_payments(actor)


# ---------------------------------------------------------------- notifications
@router.get("/notifications", response_model=list[NotificationOut])
def notifications(actor: CurrentActor, db: DB, unread_only: bool = False):
    return NotificationService(db).list(actor.user.id, unread_only)


@router.get("/notifications/unread-count")
def unread_count(actor: CurrentActor, db: DB):
    return {"count": NotificationService(db).unread_count(actor.user.id)}


@router.post("/notifications/{notification_id}/read", status_code=204)
def read(notification_id: uuid.UUID, actor: CurrentActor, db: DB):
    NotificationService(db).mark_read(actor.user.id, notification_id)
    return Response(status_code=204)


@router.post("/notifications/read-all", status_code=204)
def read_all(actor: CurrentActor, db: DB):
    NotificationService(db).mark_all_read(actor.user.id)
    return Response(status_code=204)


@router.post("/notifications/devices", status_code=204)
def register_device(data: DeviceTokenIn, actor: CurrentActor, db: DB):
    NotificationService(db).register_device(actor.user.id, data.token, data.platform)
    return Response(status_code=204)


# ---------------------------------------------------------------- coach settings
@router.get("/coach/settings")
def get_settings(actor: CoachActor):
    s = actor.coach.settings or {}
    return {"charge_rules": {**{str(k): v for k, v in DEFAULT_CHARGE_RULES.items()}, **s.get("charge_rules", {})},
            "reminder_hours": s.get("reminder_hours", 3), "timezone": actor.coach.timezone,
            "currency": actor.coach.currency, "bio": actor.coach.bio}


@router.put("/coach/settings")
def update_settings(data: CoachSettingsIn, actor: CoachActor, db: DB):
    s = dict(actor.coach.settings or {})
    if data.charge_rules is not None:
        s["charge_rules"] = {**s.get("charge_rules", {}), **data.charge_rules}
    if data.reminder_hours is not None:
        s["reminder_hours"] = data.reminder_hours
    actor.coach.settings = s
    if data.timezone:
        actor.coach.timezone = data.timezone
    if data.bio is not None:
        actor.coach.bio = data.bio
    db.commit()
    return get_settings(actor)


# ---------------------------------------------------------------- offline sync (pull)
@router.get("/sync/changes")
def sync_changes(actor: CoachActor, db: DB, since: datetime):
    """Delta pull for an offline-first client: everything changed after `since` (incl. tombstones)."""
    cid = actor.coach_id

    def rows(model, extra=None):
        stmt = select(model).where(model.updated_at > since)
        stmt = stmt.where(model.coach_id == cid) if hasattr(model, "coach_id") else stmt
        if extra is not None:
            stmt = stmt.where(extra)
        return [{c.name: getattr(r, c.name) for c in model.__table__.columns} for r in db.scalars(stmt)]

    session_ids = select(TrainingSession.id).where(TrainingSession.coach_id == cid)
    return {
        "server_time": datetime.now().astimezone(),
        "students": rows(Student),
        "sessions": rows(TrainingSession),
        "attendance": rows(Attendance, Attendance.session_id.in_(session_ids)),
        "payments": rows(Payment),
    }
