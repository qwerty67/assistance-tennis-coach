from datetime import date, time

from app.domain import jalali
from app.domain.attendance_rules import is_chargeable
from app.domain.enums import AttendanceStatus, BillingMode, FinancialStatus
from app.domain.finance import ChargeLine, account_snapshot
from app.domain.pricing import PriceBreakdown, per_student_shares, split_amount
from app.domain.scheduling import Slot, generate_recurring


def test_split_exact():
    assert split_amount(1_400_000, 3) == [466_667, 466_667, 466_666]
    assert sum(split_amount(1_000_001, 7)) == 1_000_001


def test_shares_modes():
    assert per_student_shares(1_400_000, 2, BillingMode.SPLIT) == [700_000, 700_000]
    assert per_student_shares(4_000_000, 3, BillingMode.PER_STUDENT) == [4_000_000] * 3
    assert per_student_shares(1_400_000, 3, BillingMode.LUMP, 1) == [0, 1_400_000, 0]


def test_breakdown():
    b = PriceBreakdown.build(1_000_000, 300_000)
    assert b.coach_income == 700_000
    assert b.scale(500_000).court_cost == 150_000


def test_recurring_odd_days():
    # Persian "odd days": Saturday(5), Monday(0), Wednesday(2)
    slots = [Slot(time(17), time(18), wd) for wd in (5, 0, 2)]
    occ = generate_recurring(slots, date(2026, 10, 10), "Asia/Tehran", max_count=10)
    assert len(occ) == 10
    assert occ[0].start_at.hour == 13 and occ[0].start_at.minute == 30  # 17:00 Tehran = 13:30 UTC


def test_account_status():
    lines = [ChargeLine(1, 10_000_000, date(2026, 1, 1))]
    s = account_snapshot(lines, 6_000_000, date(2025, 12, 1))
    assert s.status == FinancialStatus.PARTIAL and s.debt == 4_000_000
    s = account_snapshot([ChargeLine(1, 100, date(2020, 1, 1))], 0, date(2026, 1, 1))
    assert s.status == FinancialStatus.OVERDUE


def test_rules():
    assert is_chargeable(AttendanceStatus.EXCUSED) is False
    assert is_chargeable(AttendanceStatus.UNEXCUSED) is True
    assert is_chargeable(AttendanceStatus.UNEXCUSED, override=False) is False
    assert is_chargeable(AttendanceStatus.EXCUSED, {"excused": True}) is True


def test_jalali():
    assert jalali.to_jalali(date(2026, 10, 7)) == (1405, 7, 15)
    assert jalali.to_gregorian(1404, 1, 1) == date(2025, 3, 21)
