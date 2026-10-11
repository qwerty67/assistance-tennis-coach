import { Redirect, Stack, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/store';
import { registerForPush } from '@/features/notifications/push';
import { getDirection } from '@/shared/hooks/useDirection';
import { colors } from '@/shared/theme';

/** Role guard: only coaches may enter this route group. */
export default function CoachLayout() {
  const { status, user } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (user?.role === 'coach') registerForPush();
  }, [user?.role]);

  if (status !== 'authenticated') return <Redirect href="/login" />;
  if (user?.role !== 'coach') return <Redirect href="/" />;

  const isSubscriptionRoute = segments.includes('subscription');
  if (!user.has_active_subscription && !isSubscriptionRoute) {
    return <Redirect href="/coach/subscription" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: getDirection().manual ? 'slide_from_left' : 'default',
      }}
    />
  );
}
