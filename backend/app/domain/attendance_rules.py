"""Configurable rules deciding whether an attendance record is chargeable.

A chargeable record = the session is consumed from the student's term
(and, for per-session billing, a fee is charged). Coaches can change the
defaults in their settings and override each record individually.
"""
from app.domain.enums import AttendanceStatus

DEFAULT_CHARGE_RULES: dict[str, bool] = {
    AttendanceStatus.PRESENT: True,
    AttendanceStatus.MAKEUP: True,
    AttendanceStatus.UNEXCUSED: True,
    AttendanceStatus.ABSENT: True,
    AttendanceStatus.EXCUSED: False,
    AttendanceStatus.CANCELLED: False,
}


def is_chargeable(status: AttendanceStatus, rules: dict | None = None, override: bool | None = None) -> bool:
    if override is not None:
        return override
    merged = {**DEFAULT_CHARGE_RULES, **(rules or {})}
    return bool(merged.get(str(status), True))
