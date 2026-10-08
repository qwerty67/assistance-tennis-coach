"""Minimal Gregorian <-> Jalali (Shamsi) conversion used for monthly reports.

Algorithm adapted from the well-known jalaali-js implementation (public domain).
"""
from datetime import date, timedelta

_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178]


def _div(a: int, b: int) -> int:
    return int(a / b)


def _jal_cal(jy: int):
    bl = len(_BREAKS)
    gy = jy + 621
    leap_j = -14
    jp = _BREAKS[0]
    jump = 0
    for i in range(1, bl):
        jm = _BREAKS[i]
        jump = jm - jp
        if jy < jm:
            break
        leap_j += _div(jump, 33) * 8 + _div(jump % 33, 4)
        jp = jm
    n = jy - jp
    leap_j += _div(n, 33) * 8 + _div((n % 33) + 3, 4)
    if jump % 33 == 4 and jump - n == 4:
        leap_j += 1
    leap_g = _div(gy, 4) - _div((_div(gy, 100) + 1) * 3, 4) - 150
    march = 20 + leap_j - leap_g
    return gy, march


def _g2d(gy: int, gm: int, gd: int) -> int:
    d = _div((gy + _div(gm - 8, 6) + 100100) * 1461, 4) + _div(153 * ((gm + 9) % 12) + 2, 5) + gd - 34840408
    return d - _div(_div(gy + 100100 + _div(gm - 8, 6), 100) * 3, 4) + 752


def _d2g(jdn: int) -> date:
    j = 4 * jdn + 139361631
    j = j + _div(_div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
    i = _div(j % 1461, 4) * 5 + 308
    gd = _div(i % 153, 5) + 1
    gm = (_div(i, 153) % 12) + 1
    gy = _div(j, 1461) - 100100 + _div(8 - gm, 6)
    return date(gy, gm, gd)


def to_jalali(d: date) -> tuple[int, int, int]:
    jdn = _g2d(d.year, d.month, d.day)
    gy = d.year
    jy = gy - 621
    _, march = _jal_cal(jy)
    jdn1f = _g2d(gy, 3, march)
    k = jdn - jdn1f
    if k >= 0:
        if k <= 185:
            return jy, 1 + _div(k, 31), (k % 31) + 1
        k -= 186
    else:
        jy -= 1
        k += 179
        if _is_leap(jy):
            k += 1
    return jy, 7 + _div(k, 30), (k % 30) + 1


def _is_leap(jy: int) -> bool:
    gy, march = _jal_cal(jy)
    gy2, march2 = _jal_cal(jy + 1)
    start = _g2d(gy, 3, march)
    nxt = _g2d(gy2, 3, march2)
    return nxt - start == 366


def to_gregorian(jy: int, jm: int, jd: int) -> date:
    gy, march = _jal_cal(jy)
    jdn = _g2d(gy, 3, march) + (jm - 1) * 31 - _div(jm, 7) * (jm - 7) + jd - 1
    return _d2g(jdn)


def month_length(jy: int, jm: int) -> int:
    if jm <= 6:
        return 31
    if jm <= 11:
        return 30
    return 30 if _is_leap(jy) else 29


def jalali_month_range(jy: int, jm: int) -> tuple[date, date]:
    """Return [start, end) gregorian dates for a Jalali month."""
    start = to_gregorian(jy, jm, 1)
    return start, start + timedelta(days=month_length(jy, jm))


def shift_month(jy: int, jm: int, delta: int) -> tuple[int, int]:
    idx = jy * 12 + (jm - 1) + delta
    return idx // 12, idx % 12 + 1
