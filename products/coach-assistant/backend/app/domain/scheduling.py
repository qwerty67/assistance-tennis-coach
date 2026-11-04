"""Pure session-generation logic for recurring and custom schedules."""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.core.exceptions import ValidationError

MAX_GENERATED = 400
MAX_SPAN_DAYS = 730


@dataclass(frozen=True)
class Slot:
    start_time: time
    end_time: time
    weekday: int | None = None  # 0=Monday ... 5=Saturday, 6=Sunday (ISO / Python)
    on_date: date | None = None  # for custom schedules


@dataclass(frozen=True)
class Occurrence:
    start_at: datetime  # aware UTC
    end_at: datetime


def _to_utc(d: date, t: time, tz: ZoneInfo) -> datetime:
    return datetime.combine(d, t, tzinfo=tz).astimezone(timezone.utc)


def _validate(slot: Slot) -> None:
    if slot.end_time <= slot.start_time:
        raise ValidationError("Slot end time must be after start time", code="invalid_slot")


def generate_recurring(
    slots: list[Slot],
    start_date: date,
    tz_name: str,
    end_date: date | None = None,
    max_count: int | None = None,
) -> list[Occurrence]:
    if not slots:
        raise ValidationError("At least one slot is required", code="invalid_schedule")
    if end_date is None and not max_count:
        raise ValidationError("end_date or session count is required", code="invalid_schedule")
    for s in slots:
        _validate(s)
        if s.weekday is None or not 0 <= s.weekday <= 6:
            raise ValidationError("Recurring slot needs weekday 0..6", code="invalid_slot")
    tz = ZoneInfo(tz_name)
    by_day: dict[int, list[Slot]] = {}
    for s in slots:
        by_day.setdefault(s.weekday, []).append(s)
    for v in by_day.values():
        v.sort(key=lambda s: s.start_time)

    result: list[Occurrence] = []
    limit = min(max_count or MAX_GENERATED, MAX_GENERATED)
    day = start_date
    last = end_date or (start_date + timedelta(days=MAX_SPAN_DAYS))
    while day <= last and len(result) < limit:
        for s in by_day.get(day.weekday(), []):
            if len(result) >= limit:
                break
            result.append(Occurrence(_to_utc(day, s.start_time, tz), _to_utc(day, s.end_time, tz)))
        day += timedelta(days=1)
    return result


def generate_custom(slots: list[Slot], tz_name: str) -> list[Occurrence]:
    tz = ZoneInfo(tz_name)
    out = []
    for s in slots:
        _validate(s)
        if s.on_date is None:
            raise ValidationError("Custom slot needs a date", code="invalid_slot")
        out.append(Occurrence(_to_utc(s.on_date, s.start_time, tz), _to_utc(s.on_date, s.end_time, tz)))
    return sorted(out, key=lambda o: o.start_at)
