import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, ListRow, IconName } from '@/shared/components';
import { colors } from '@/shared/theme';
import { digits, formatMoney } from '@/shared/utils/format';
import type { Reminder } from '@/shared/types/api';

const META: Record<Reminder['type'], { icon: IconName; color: string; go: (r: Reminder) => void }> = {
  attendance_missing: { icon: 'clipboard-alert-outline', color: colors.warning, go: (r) => router.push(`/coach/session/${r.session_ids?.[0]}`) },
  makeup_pending: { icon: 'calendar-refresh-outline', color: colors.info, go: () => router.push('/coach/makeups') },
  overdue_payments: { icon: 'cash-clock', color: colors.danger, go: () => router.push('/coach/finance') },
  terms_ending: { icon: 'flag-checkered', color: colors.primary, go: () => router.push('/coach/students') },
};

export function ReminderList({ reminders }: { reminders: Reminder[] }) {
  const { t } = useTranslation();
  if (!reminders.length) return null;
  return (
    <Card padded={false} style={{ paddingHorizontal: 16 }}>
      {reminders.map((r, i) => {
        const m = META[r.type];
        return (
          <View key={r.type}>
            <ListRow
              icon={m.icon}
              title={t(`dashboard.reminder.${r.type}`, { n: digits(r.count) })}
              subtitle={r.amount ? formatMoney(r.amount) : undefined}
              onPress={() => m.go(r)}
              divider={i < reminders.length - 1}
            />
          </View>
        );
      })}
    </Card>
  );
}
