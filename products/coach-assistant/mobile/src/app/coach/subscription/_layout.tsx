import { Stack } from 'expo-router';
import { colors } from '@/shared/theme';

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
