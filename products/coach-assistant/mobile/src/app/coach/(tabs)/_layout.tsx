import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TabBarIcon, useTabScreenOptions } from '@/shared/components';

export default function CoachTabs() {
  const { t } = useTranslation();
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: t('nav.dashboard'), tabBarIcon: ({ focused }) => <TabBarIcon name="view-dashboard-outline" focused={focused} /> }} />
      <Tabs.Screen name="students" options={{ title: t('nav.students'), tabBarIcon: ({ focused }) => <TabBarIcon name="account-group-outline" focused={focused} /> }} />
      <Tabs.Screen name="calendar" options={{ title: t('nav.calendar'), tabBarIcon: ({ focused }) => <TabBarIcon name="calendar-month-outline" focused={focused} /> }} />
      <Tabs.Screen name="classes" options={{ title: t('nav.classes'), tabBarIcon: ({ focused }) => <TabBarIcon name="tennis" focused={focused} /> }} />
      <Tabs.Screen name="finance" options={{ title: t('nav.finance'), tabBarIcon: ({ focused }) => <TabBarIcon name="wallet-outline" focused={focused} /> }} />
    </Tabs>
  );
}
