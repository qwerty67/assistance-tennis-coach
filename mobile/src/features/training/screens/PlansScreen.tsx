import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePlans } from '../api';
import { PlanCard } from '../components/PlanCard';
import { EmptyState, ErrorView, Fab, Header, Screen, SkeletonList } from '@/shared/components';

export function PlansScreen({ role = 'coach' }: { role?: 'coach' | 'student' }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = usePlans();
  const base = role === 'coach' ? '/coach' : '/student';
  return (
    <Screen onRefresh={refetch} header={<Header large={role === 'student'} back={role === 'coach'} title={role === 'coach' ? t('training.title') : t('training.myPlan')} />}
      overlay={role === 'coach' ? <Fab label={t('training.newPlan')} onPress={() => router.push('/coach/training/form')} /> : undefined}>
      {error ? <ErrorView error={error} onRetry={refetch} /> : isLoading ? <SkeletonList /> : data?.length ? (
        data.map((p, i) => <PlanCard key={p.id} plan={p} index={i} showStudent={role === 'coach'} onPress={() => router.push(`${base}/training/${p.id}`)} />)
      ) : <EmptyState icon="clipboard-text-outline" title={t('training.empty')} description={role === 'coach' ? t('training.emptyHint') : undefined} />}
    </Screen>
  );
}
