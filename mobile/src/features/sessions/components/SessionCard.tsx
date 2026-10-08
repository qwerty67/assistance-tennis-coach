import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Badge, Card, Icon } from '@/shared/components';
import { classTypeColors, colors, spacing } from '@/shared/theme';
import { digits, formatTime } from '@/shared/utils/format';
import type { Session } from '@/shared/types/api';

/** Compact session row: time, class color bar, students, status badges. */
export function SessionCard({ session, onPress, index = 0, showDate }: { session: Session; onPress?: () => void; index?: number; showDate?: string }) {
  const { t } = useTranslation();
  const tc = classTypeColors[session.class_type] ?? classTypeColors.private;
  const cancelled = session.status === 'cancelled';
  return (
    <Card onPress={onPress} index={index} padded={false} style={cancelled && { opacity: 0.6 }}>
      <View style={styles.row}>
        <View style={[styles.bar, { backgroundColor: tc.main }]} />
        <View style={styles.time}>
          <AppText variant="h3">{formatTime(session.start_at)}</AppText>
          <AppText variant="caption" muted>{formatTime(session.end_at)}</AppText>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <AppText variant="bodyMedium" numberOfLines={1} style={[{ flex: 1 }, cancelled && styles.strike]}>
              {session.class_name}
              {session.sequence_number ? <AppText variant="small" muted>{`  ·  ${t('sessions.no', { n: digits(session.sequence_number) })}`}</AppText> : null}
            </AppText>
          </View>
          <AppText variant="small" muted numberOfLines={1}>
            {showDate ? `${showDate} · ` : ''}
            {session.student_names.length ? session.student_names.join('، ') : t('sessions.noStudents')}
          </AppText>
          <View style={styles.badges}>
            <Badge dot label={t(`classes.type.${session.class_type}`)} color={tc.main} bg={tc.soft} />
            {session.is_makeup ? <Badge label={t('sessions.makeup')} color={colors.info} bg={colors.infoSoft} /> : null}
            {cancelled ? <Badge label={t('sessions.status.cancelled')} color={colors.danger} bg={colors.dangerSoft} /> : null}
            {session.status === 'completed' ? <Badge label={t('sessions.status.completed')} color={colors.success} bg={colors.successSoft} /> : null}
          </View>
        </View>
        {session.attendance_done ? (
          <Icon name="check-circle" size={22} color={colors.success} />
        ) : session.status === 'scheduled' ? (
          <Icon name="chevron-left" size={22} color={colors.textSubtle} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, paddingStart: 0 },
  bar: { width: 4, alignSelf: 'stretch', borderTopEndRadius: 4, borderBottomEndRadius: 4 },
  time: { alignItems: 'center', minWidth: 52 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  strike: { textDecorationLine: 'line-through' },
});
