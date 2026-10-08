import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/store';
import { registerForPush } from '@/features/notifications/push';
import { getDirection } from '@/shared/hooks/useDirection';
import { colors } from '@/shared/theme';

/** Role guard: students only see their own data (enforced again by the API). */
export default function StudentLayout() {
  const { status, user } = useAuth();
  useEffect(() => {
    if (user?.role === 'student') registerForPush();
  }, [user?.role]);
  if (status !== 'authenticated') return <Redirect href="/login" />;
  if (user?.role !== 'student') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: getDirection().manual ? 'slide_from_left' : 'default' }} />;
}
