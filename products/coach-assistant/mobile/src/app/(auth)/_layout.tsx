import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/features/auth/store';
import { LoadingView } from '@/shared/components';
import { getDirection } from '@/shared/hooks/useDirection';
import { colors } from '@/shared/theme';

export default function AuthLayout() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return <LoadingView />;
  }

  if (status === 'authenticated') {
    return <Redirect href={user?.role === 'coach' ? '/coach' : '/student'} />;
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
