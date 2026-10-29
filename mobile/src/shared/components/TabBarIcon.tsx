import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { colors } from '@/shared/theme';

export function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 46, height: 30, borderRadius: 15, backgroundColor: focused ? colors.accentSoft : 'transparent' }}>
      <Icon name={name} size={22} color={focused ? colors.navy : colors.textSubtle} />
    </View>
  );
}

/** Dynamic tab bar options that automatically adapt to Android 3-button navigation and iOS safe areas */
export function useTabScreenOptions() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 12 : 8);

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.navy,
    tabBarInactiveTintColor: colors.textSubtle,
    tabBarLabelStyle: { fontFamily: 'Vazirmatn_500Medium', fontSize: 11 },
    tabBarStyle: {
      height: 60 + bottomInset,
      paddingTop: 6,
      paddingBottom: bottomInset,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
  };
}

export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.navy,
  tabBarInactiveTintColor: colors.textSubtle,
  tabBarLabelStyle: { fontFamily: 'Vazirmatn_500Medium', fontSize: 11 },
  tabBarStyle: { height: 68, paddingTop: 6, paddingBottom: 8, borderTopColor: colors.border, backgroundColor: colors.surface },
} as const;
