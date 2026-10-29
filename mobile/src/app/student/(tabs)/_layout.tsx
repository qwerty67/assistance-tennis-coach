import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TabBarIcon, useTabScreenOptions } from '@/shared/components';

export default function StudentTabs() {
  const { t } = useTranslation();
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: t('nav.dashboard'), tabBarIcon: ({ focused }) => <TabBarIcon name="home-variant-outline" focused={focused} /> }} />
      <Tabs.Screen name="classes" options={{ title: t('nav.myClasses'), tabBarIcon: ({ focused }) => <TabBarIcon name="tennis" focused={focused} /> }} />
      <Tabs.Screen name="calendar" options={{ title: t('nav.calendar'), tabBarIcon: ({ focused }) => <TabBarIcon name="calendar-month-outline" focused={focused} /> }} />
      <Tabs.Screen name="payments" options={{ title: t('nav.payments'), tabBarIcon: ({ focused }) => <TabBarIcon name="wallet-outline" focused={focused} /> }} />
      <Tabs.Screen name="training" options={{ title: t('nav.training'), tabBarIcon: ({ focused }) => <TabBarIcon name="clipboard-text-outline" focused={focused} /> }} />
    </Tabs>
  );
}
