import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useNotifications, useReadAll, useReadNotification } from '../api';
import { useAuth } from '@/features/auth/store';
import { AppText, Card, EmptyState, ErrorView, Header, Icon, IconName, Screen, SkeletonList, Button, Sheet } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { formatDate } from '@/shared/utils/format';
import type { AppNotification } from '@/shared/types/api';

const ICON: Record<string, IconName> = {
  session_reminder: 'alarm',
  session_rescheduled: 'calendar-clock',
  session_created: 'calendar-plus',
  makeup_created: 'calendar-refresh',
  payment_due: 'cash-clock',
  debt_reminder: 'alert-circle-outline',
  payment_recorded: 'cash-check',
  session_cancelled: 'calendar-remove',
  class_created: 'tennis',
  training_plan_created: 'clipboard-list',
};

export function NotificationsScreen() {
  const { t } = useTranslation();
  const role = useAuth((s) => s.user?.role);
  const { data, isLoading, error, refetch } = useNotifications();
  const read = useReadNotification();
  const readAll = useReadAll();
  const [selected, setSelected] = useState<AppNotification | null>(null);

  const open = (n: AppNotification) => {
    if (!n.is_read) {
      read.mutate(n.id);
    }
    setSelected(n);
  };

  return (
    <Screen onRefresh={refetch} header={<Header back title={t('notifications.title')} right={data?.some((n) => !n.is_read) ? <Button size="sm" variant="ghost" title={t('notifications.readAll')} onPress={() => readAll.mutate()} /> : undefined} />}>
      {error ? <ErrorView error={error} onRetry={refetch} /> : isLoading ? <SkeletonList /> : data?.length ? data.map((n, i) => (
        <Card key={n.id} index={i} onPress={() => open(n)} style={[{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }, !n.is_read && { borderColor: colors.primary, borderWidth: 1 }]}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: n.is_read ? colors.surfaceMuted : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={ICON[n.type] ?? 'bell-outline'} size={20} color={n.is_read ? colors.textMuted : colors.primaryDark} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="bodyMedium" style={{ fontWeight: !n.is_read ? '700' : '400' }}>{n.title}</AppText>
              {!n.is_read ? (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
              ) : null}
            </View>
            {n.body ? <AppText variant="small" muted numberOfLines={2}>{n.body}</AppText> : null}
            <AppText variant="caption" muted>{formatDate(n.created_at, 'D MMMM HH:mm')}</AppText>
          </View>
        </Card>
      )) : <EmptyState icon="bell-sleep-outline" title={t('notifications.empty')} />}

      <Sheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || t('notifications.detailTitle')}
        footer={
          <View style={{ gap: spacing.sm }}>
            {selected?.data?.session_id ? (
              <Button
                title={t('notifications.viewSession')}
                icon="calendar-clock"
                onPress={() => {
                  const sid = selected.data?.session_id as string;
                  setSelected(null);
                  router.push(`/${role}/session/${sid}`);
                }}
              />
            ) : null}
            {selected?.data?.plan_id ? (
              <Button
                title={t('notifications.viewPlan')}
                icon="clipboard-list"
                onPress={() => {
                  setSelected(null);
                  router.push(`/${role}/training`);
                }}
              />
            ) : null}
            {selected?.data?.payment_id || selected?.data?.charge_id || selected?.type?.includes('payment') || selected?.type?.includes('debt') ? (
              <Button
                title={t('notifications.viewPayments')}
                icon="cash-check"
                onPress={() => {
                  setSelected(null);
                  router.push(role === 'student' ? '/student/payments' : '/coach/finance');
                }}
              />
            ) : null}
            <Button
              title={t('common.close')}
              variant="outline"
              onPress={() => setSelected(null)}
            />
          </View>
        }
      >
        {selected ? (
          <View style={{ gap: spacing.md, paddingVertical: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={ICON[selected.type] ?? 'bell-outline'} size={24} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="h3">{selected.title}</AppText>
                <AppText variant="caption" muted>{formatDate(selected.created_at, 'D MMMM YYYY - HH:mm')}</AppText>
              </View>
            </View>
            {selected.body ? (
              <Card tone="muted" style={{ padding: spacing.md }}>
                <AppText variant="bodyMedium" style={{ lineHeight: 22 }}>
                  {selected.body}
                </AppText>
              </Card>
            ) : null}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
