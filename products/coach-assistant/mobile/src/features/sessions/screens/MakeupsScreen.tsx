import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDismissMakeup, useMakeups } from '../api';
import { AppText, Button, Card, EmptyState, ErrorView, Header, Screen, SkeletonList } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { formatDate, formatTime } from '@/shared/utils/format';

/** Pending makeups queue – nothing cancelled is forgotten. */
export function MakeupsScreen() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useMakeups();
  const dismiss = useDismissMakeup();
  const pending = (data ?? []).filter((m) => m.status === 'pending');
  return (
    <Screen onRefresh={refetch} header={<Header back title={t('makeups.title')} subtitle={t('makeups.subtitle')} />}>
      {error ? <ErrorView error={error} onRetry={refetch} /> : isLoading ? <SkeletonList /> : pending.length ? pending.map((m, i) => (
        <Card key={m.id} index={i} style={{ gap: spacing.sm }}>
          <AppText variant="bodyMedium">{m.class_name}{m.student_name ? ` · ${m.student_name}` : ''}</AppText>
          {m.original_start_at ? <AppText variant="small" muted>{t('makeups.cancelledOn', { d: `${formatDate(m.original_start_at, 'dddd D MMMM')} ${formatTime(m.original_start_at)}` })}</AppText> : null}
          {m.reason ? <AppText variant="small" muted>{t(`attendance.reason.${m.reason}`, { defaultValue: m.reason })}</AppText> : null}
          <AppText variant="small" color={colors.info}>{m.suggestion ?? t('sessions.makeupHint')}</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button size="sm" title={t('sessions.createMakeup')} icon="calendar-plus" style={{ flex: 1 }}
              onPress={() => router.push(`/coach/session/form?mode=makeup&id=${m.original_session_id}&makeupId=${m.id}${m.student_id ? `&studentId=${m.student_id}` : ''}`)} />
            <Button size="sm" variant="ghost" title={t('makeups.dismiss')} onPress={() => dismiss.mutate(m.id)} />
          </View>
        </Card>
      )) : <EmptyState icon="calendar-check-outline" title={t('makeups.empty')} />}
    </Screen>
  );
}
