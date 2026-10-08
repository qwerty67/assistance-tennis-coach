import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNotifications, useReadAll, useReadNotification } from '../api';
import { useAuth } from '@/features/auth/store';
import { AppText, Card, EmptyState, ErrorView, Header, Icon, IconName, Screen, SkeletonList, Button } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { formatDate } from '@/shared/utils/format';
import type { AppNotification } from '@/shared/types/api';

const ICON: Record<string, IconName> = {
  session_reminder: 'alarm', session_rescheduled: 'calendar-clock', session_created: 'calendar-plus', makeup_created: 'calendar-refresh',
  payment_due: 'cash-clock', debt_reminder: 'alert-circle-outline', payment_recorded: 'cash-check', session_cancelled: 'calendar-remove',
};

export function NotificationsScreen() {
  const { t } = useTranslation();
  const role = useAuth((s) => s.user?.role);
  const { data, isLoading, error, refetch } = useNotifications();
  const read = useReadNotification();
  const readAll = useReadAll();
  const open = (n: AppNotification) => {
    if (!n.is_read) read.mutate(n.id);
    const sid = n.data?.session_id as string | undefined;
    if (sid) router.push(`/${role}/session/${sid}`);
  };
  return (
    <Screen onRefresh={refetch} header={<Header back title={t('notifications.title')} right={data?.some((n) => !n.is_read) ? <Button size="sm" variant="ghost" title={t('notifications.readAll')} onPress={() => readAll.mutate()} /> : undefined} />}>
      {error ? <ErrorView error={error} onRetry={refetch} /> : isLoading ? <SkeletonList /> : data?.length ? data.map((n, i) => (
        <Card key={n.id} index={i} onPress={() => open(n)} style={[{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }, !n.is_read && { borderColor: colors.primary, borderWidth: 1 }]}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: n.is_read ? colors.surfaceMuted : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={ICON[n.type] ?? 'bell-outline'} size={20} color={n.is_read ? colors.textMuted : colors.primaryDark} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyMedium">{n.title}</AppText>
            {n.body ? <AppText variant="small" muted>{n.body}</AppText> : null}
            <AppText variant="caption" muted>{formatDate(n.created_at, 'D MMMM HH:mm')}</AppText>
          </View>
        </Card>
      )) : <EmptyState icon="bell-sleep-outline" title={t('notifications.empty')} />}
    </Screen>
  );
}
