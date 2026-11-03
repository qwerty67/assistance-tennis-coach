import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/store';
import { LoadingView } from '@/shared/components';

export default function Index() {
  const { status, user } = useAuth();
  if (status === 'loading') return <LoadingView />;
  if (status === 'guest' || !user) return <Redirect href="/login" />;
  if (user.role === 'coach') {
    if (!user.has_active_subscription) {
      return <Redirect href="/coach/subscription" />;
    }
    return <Redirect href="/coach" />;
  }
  return <Redirect href="/student" />;
}
