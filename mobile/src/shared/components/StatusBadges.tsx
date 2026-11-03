import { useTranslation } from 'react-i18next';
import { Badge } from './Badge';
import { attendanceColors, classTypeColors, financialStatusColors } from '@/shared/theme';

/** 🟢 settled · 🟡 partial · 🔴 debt/overdue · 🔵 credit */
export function FinancialBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const c = financialStatusColors[status] ?? financialStatusColors.unpaid;
  return <Badge dot label={t(`finance.status.${status}`)} color={c.main} bg={c.soft} />;
}

export function ChargeBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const c = financialStatusColors[status] ?? financialStatusColors.unpaid;
  return <Badge dot label={t(`finance.chargeStatus.${status}`)} color={c.main} bg={c.soft} />;
}

export function AttendanceBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const c = attendanceColors[status] ?? attendanceColors.cancelled;
  return <Badge label={t(`attendance.status.${status}`)} color={c.main} bg={c.soft} />;
}

export function ClassTypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  const c = classTypeColors[type] ?? classTypeColors.private;
  return <Badge dot label={t(`classes.type.${type}`)} color={c.main} bg={c.soft} />;
}
