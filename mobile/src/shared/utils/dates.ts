import dayjs, { Dayjs } from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);

/** Python/ISO weekday used by the API: 0=Monday ... 5=Saturday, 6=Sunday */
export type ApiWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Persian week starts on Saturday. Order of API weekdays in a Persian week. */
export const PERSIAN_WEEK: ApiWeekday[] = [5, 6, 0, 1, 2, 3, 4];

/** JS getDay (0=Sunday) -> API weekday */
export const jsToApiWeekday = (jsDay: number): ApiWeekday => (((jsDay + 6) % 7) as ApiWeekday);

// روزهای زوج در تقویم ورزشی و رسمی ایران: شنبه (5)، دوشنبه (0)، چهارشنبه (2)
export const EVEN_DAYS: ApiWeekday[] = [5, 0, 2];

// روزهای فرد در تقویم ورزشی و رسمی ایران: یکشنبه (6)، سه‌شنبه (1)، پنج‌شنبه (3)
export const ODD_DAYS: ApiWeekday[] = [6, 1, 3];

export const toISODate = (d: Dayjs | Date) => dayjs(d).format('YYYY-MM-DD');

/** Start of a Persian week (Saturday) for the given day. */
export function startOfPersianWeek(day: Dayjs): Dayjs {
  const offset = (day.day() + 1) % 7; // Saturday -> 0
  return day.startOf('day').subtract(offset, 'day');
}

export function combineDateTime(date: string, time: string): string {
  return dayjs(`${date}T${time}`).toISOString();
}

/** Days for a jalali month grid (6 rows x 7), starting Saturday. */
export function jalaliMonthGrid(anchor: Dayjs): Dayjs[] {
  const j = anchor.calendar('jalali');
  const first = j.startOf('month');
  const start = startOfPersianWeek(first.calendar('gregory'));
  return Array.from({ length: 42 }, (_, i) => start.add(i, 'day'));
}

export function sameDay(a: Dayjs | string, b: Dayjs | string) {
  return dayjs(a).isSame(dayjs(b), 'day');
}
