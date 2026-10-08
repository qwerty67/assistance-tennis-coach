import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Button, Icon } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';
import { digits, formatRelativeDay, formatTime } from '@/shared/utils/format';
import type { Session } from '@/shared/types/api';

/** Big navy card with the next session – the first thing a coach needs on court. */
export function NextSessionHero({ session, onOpen, actionLabel }: { session: Session | null; onOpen?: () => void; actionLabel?: string }) {
  const { t } = useTranslation();
  if (!session) {
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
        <Icon name="weather-sunny" size={28} color={colors.accent} />
        <AppText variant="h2" color={colors.textInverse}>{t('dashboard.noUpcoming')}</AppText>
        <AppText variant="small" color="rgba(255,255,255,0.7)">{t('dashboard.noUpcomingHint')}</AppText>
      </Animated.View>
    );
  }
  const mins = dayjs(session.start_at).diff(dayjs(), 'minute');
  const live = mins <= 0 && dayjs(session.end_at).isAfter(dayjs());
  const countdown = live ? t('dashboard.inProgress') : mins < 60 ? t('dashboard.inMinutes', { n: digits(mins) }) : mins < 60 * 24 ? t('dashboard.inHours', { n: digits(Math.round(mins / 60)) }) : formatRelativeDay(session.start_at);
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.pill, live && { backgroundColor: colors.accent }]}>
          {live ? <View style={styles.liveDot} /> : null}
          <AppText variant="caption" color={live ? colors.navy : colors.accent}>{countdown}</AppText>
        </View>
        <AppText variant="small" color="rgba(255,255,255,0.65)">{t('dashboard.nextSession')}</AppText>
      </View>
      <AppText variant="display" color={colors.textInverse}>{`${formatTime(session.start_at)} – ${formatTime(session.end_at)}`}</AppText>
      <AppText variant="h3" color={colors.textInverse}>{session.class_name}</AppText>
      <View style={styles.meta}>
        <Icon name="account-multiple-outline" size={16} color="rgba(255,255,255,0.7)" />
        <AppText variant="small" color="rgba(255,255,255,0.8)" numberOfLines={1} style={{ flex: 1 }}>{session.student_names.join('، ') || '—'}</AppText>
      </View>
      {session.location ? (
        <View style={styles.meta}>
          <Icon name="map-marker-outline" size={16} color="rgba(255,255,255,0.7)" />
          <AppText variant="small" color="rgba(255,255,255,0.8)">{session.location}</AppText>
        </View>
      ) : null}
      {onOpen ? <Button title={actionLabel ?? t('attendance.take')} icon="clipboard-check-outline" variant="accent" onPress={onOpen} style={{ marginTop: spacing.sm }} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.xs, overflow: 'hidden' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(200,241,105,0.14)', paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radius.pill },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
