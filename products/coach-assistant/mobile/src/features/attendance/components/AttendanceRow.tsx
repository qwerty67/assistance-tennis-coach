import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { AppText, AttendanceBadge, Avatar, Chips, FinancialBadge, PressableScale, Icon } from '@/shared/components';
import { attendanceColors, colors, radius, spacing } from '@/shared/theme';
import { digits } from '@/shared/utils/format';
import type { AbsenceReason, AttendanceStatus, SessionStudent } from '@/shared/types/api';

export interface AttendanceDraft { status: AttendanceStatus | null; reason: AbsenceReason | null; chargeable: boolean | null }

const QUICK: AttendanceStatus[] = ['present', 'excused', 'unexcused', 'absent', 'makeup'];
const ICONS = { present: 'check', excused: 'calendar-alert', unexcused: 'close', absent: 'account-off-outline', makeup: 'calendar-refresh', cancelled: 'cancel' } as const;
const REASONS: AbsenceReason[] = ['illness', 'travel', 'personal', 'exam', 'miscommunication', 'other'];

/** One-tap attendance for a student: big status buttons, reason + charge override only when needed. */
export function AttendanceRow({ student, draft, onChange, readonly }: { student: SessionStudent; draft: AttendanceDraft; onChange: (d: AttendanceDraft) => void; readonly?: boolean }) {
  const { t } = useTranslation();
  const absent = draft.status && draft.status !== 'present' && draft.status !== 'makeup';
  return (
    <Animated.View layout={LinearTransition.duration(220)} style={styles.card}>
      <View style={styles.head}>
        <Avatar name={student.full_name} size={40} />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium">{student.full_name}</AppText>
          <AppText variant="caption" muted>
            {student.remaining_sessions != null ? t('students.remaining', { n: digits(student.remaining_sessions) }) : ''}
          </AppText>
        </View>
        <FinancialBadge status={student.financial_status} />
      </View>
      {readonly ? (
        <View style={{ flexDirection: 'row' }}>{draft.status ? <AttendanceBadge status={draft.status} /> : <AppText variant="small" muted>{t('attendance.notRecorded')}</AppText>}</View>
      ) : (
      <View style={styles.row}>
        {QUICK.map((s) => {
          const on = draft.status === s;
          const c = attendanceColors[s];
          return (
            <PressableScale key={s} disabled={readonly} scaleTo={0.9} onPress={() => onChange({ ...draft, status: s, reason: s === 'present' ? null : draft.reason })}
              style={[styles.btn, { backgroundColor: on ? c.main : c.soft }]}>
              <Icon name={ICONS[s]} size={18} color={on ? '#fff' : c.main} />
              <AppText variant="caption" color={on ? '#fff' : c.main} numberOfLines={1}>{t(`attendance.status.${s}`)}</AppText>
            </PressableScale>
          );
        })}
      </View>
      )}
      {absent && !readonly ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ gap: spacing.sm }}>
          <Chips scroll size="sm" value={draft.reason} onChange={(r) => onChange({ ...draft, reason: r })} options={REASONS.map((r) => ({ value: r, label: t(`attendance.reason.${r}`) }))} />
          <Chips size="sm" label={t('attendance.charge')} value={draft.chargeable === null ? 'auto' : draft.chargeable ? 'yes' : 'no'}
            onChange={(v) => onChange({ ...draft, chargeable: v === 'auto' ? null : v === 'yes' })}
            options={[{ value: 'auto', label: t('attendance.chargeAuto') }, { value: 'yes', label: t('attendance.chargeYes') }, { value: 'no', label: t('attendance.chargeNo') }]} />
        </Animated.View>
      ) : null}
      {readonly && draft.reason ? <AppText variant="small" muted>{t(`attendance.reason.${draft.reason}`)}</AppText> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  row: { flexDirection: 'row', gap: 6 },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: radius.md, gap: 2 },
});
