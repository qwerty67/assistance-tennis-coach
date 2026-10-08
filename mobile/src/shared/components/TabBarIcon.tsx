import { View } from 'react-native';
import { Icon, IconName } from './Icon';
import { colors } from '@/shared/theme';

export function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 46, height: 30, borderRadius: 15, backgroundColor: focused ? colors.accentSoft : 'transparent' }}>
      <Icon name={name} size={22} color={focused ? colors.navy : colors.textSubtle} />
    </View>
  );
}

export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.navy,
  tabBarInactiveTintColor: colors.textSubtle,
  tabBarLabelStyle: { fontFamily: 'Vazirmatn_500Medium', fontSize: 11 },
  tabBarStyle: { height: 68, paddingTop: 6, paddingBottom: 8, borderTopColor: colors.border, backgroundColor: colors.surface },
} as const;
