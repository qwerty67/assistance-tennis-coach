import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/store';
import { LoadingView } from '@/shared/components';

export default function Index() {
  const { status, user } = useAuth();
  if (status === 'loading') return <LoadingView />;
  if (status === 'guest' || !user) return <Redirect href="/login" />;
  return <Redirect href={user.role === 'coach' ? '/coach' : '/student'} />;
}
