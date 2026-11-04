import dayjs from 'dayjs';
import jalaliday from 'jalaliday';
import i18n from '@/shared/i18n';

dayjs.extend(jalaliday);

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const isFa = () => (i18n.language || 'fa').startsWith('fa');

/** Convert latin digits to Persian digits when UI language is Persian. */
export function digits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return isFa() ? s.replace(/\d/g, (d) => FA_DIGITS[Number(d)]) : s;
}

/** Normalize Persian / Arabic digits typed by the user to latin digits. */
export function toLatinDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return digits(0);
  const s = Math.round(n).toLocaleString('en-US');
  return digits(s).replace(/,/g, isFa() ? '٬' : ',');
}

export function formatMoney(n: number | null | undefined, withUnit = true): string {
  const s = formatNumber(n);
  return withUnit ? `${s} ${i18n.t('common.currency')}` : s;
}

/** 85_000_000 -> "۸۵ میلیون" */
export function formatMoneyShort(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${digits(+(abs / 1_000_000_000).toFixed(1))} ${i18n.t('common.billion')}`;
  if (abs >= 1_000_000) return `${sign}${digits(+(abs / 1_000_000).toFixed(1))} ${i18n.t('common.million')}`;
  if (abs >= 1_000) return `${sign}${digits(Math.round(abs / 1000))} ${i18n.t('common.thousand')}`;
  return `${sign}${digits(abs)}`;
}

const cal = () => (isFa() ? 'jalali' : 'gregory');
const loc = () => (isFa() ? 'fa' : 'en');

export const d = (v?: string | Date | dayjs.Dayjs) => dayjs(v).calendar(cal() as 'jalali').locale(loc());

export function formatDate(v: string | Date | undefined | null, fmt = 'D MMMM YYYY'): string {
  if (!v) return '';
  return digits(d(v).format(fmt));
}

export function formatTime(v: string | Date | undefined | null): string {
  if (!v) return '';
  return digits(dayjs(v).format('HH:mm'));
}

export function formatWeekday(v: string | Date): string {
  return d(v).format('dddd');
}

export function formatRelativeDay(v: string | Date): string {
  const day = dayjs(v).startOf('day');
  const today = dayjs().startOf('day');
  const diff = day.diff(today, 'day');
  if (diff === 0) return i18n.t('common.today');
  if (diff === 1) return i18n.t('common.tomorrow');
  if (diff === -1) return i18n.t('common.yesterday');
  return `${formatWeekday(v)} ${formatDate(v, 'D MMMM')}`;
}

export function jalaliMonthName(month: number): string {
  return i18n.t(`calendar.jalaliMonths.${month - 1}`);
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}
