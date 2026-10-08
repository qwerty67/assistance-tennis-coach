import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStudentDashboard } from '@/features/dashboard/api';
import { NextSessionHero } from '@/features/dashboard/components/NextSessionHero';
import { SessionCard } from '@/features/sessions/components/SessionCard';
import { PlanCard } from '@/features/training/components/PlanCard';
import { useAuth } from '@/features/auth/store';
import { AppText, Avatar, Card, EmptyState, ErrorView, FinancialBadge, IconButton, PressableScale, ProgressBar, Screen, SectionHeader, SkeletonList, StatCard } from '@/shared/components';
import { colors, financialStatusColors, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney, formatMoneyShort, formatRelativeDay } from '@/shared/utils/format';
import { useRefresh } from '@/shared/hooks/useRefresh';

export function StudentDashboardScreen() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const { data, isLoading, error, refetch } = useStudentDashboard();
  const { refreshing, onRefresh } = useRefresh(refetch);

  const header = (
    <View style={styles.header}>
      <PressableScale onPress={() => router.push('/student/profile')}><Avatar name={`${user?.first_name} ${user?.last_name}`} size={46} /></PressableScale>
      <View style={{ flex: 1 }}>
        <AppText variant="small" muted>{formatDate(new Date(), 'dddd D MMMM')}</AppText>
        <AppText variant="h2">{t('dashboard.hello', { name: user?.first_name })}</AppText>
      </View>
      <IconButton icon="bell-outline" badge={data?.unread_notifications} onPress={() => router.push('/notifications')} />
    </View>
  );
  if (error) return <Screen header={header}><ErrorView error={error} onRetry={refetch} /></Screen>;
  if (isLoading || !data) return <Screen header={header}><SkeletonList /></Screen>;

  if (!data.profiles.length) {
    return <Screen header={header}><EmptyState icon="account-clock-outline" title={t('student.notLinked')} description={t('student.notLinkedHint')} /></Screen>;
  }
  const f = data.financial;
  const fc = financialStatusColors[f.status];
  return (
    <Screen header={header} refreshing={refreshing} onRefresh={onRefresh}>
      <NextSessionHero session={data.next_session} onOpen={data.next_session ? () => router.push(`/student/session/${data.next_session!.id}`) : undefined} actionLabel={t('common.details')} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatCard icon="counter" label={t('student.remainingSessions')} value={digits(data.remaining_sessions)} onPress={() => router.push('/student/classes')} />
        <StatCard icon="wallet-outline" label={f.debt ? t('finance.debt') : t('finance.balance')} value={formatMoneyShort(f.debt || f.credit)} tint={fc.main} soft={fc.soft} onPress={() => router.push('/student/payments')} />
      </View>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }} onPress={() => router.push('/student/payments')}>
        <View style={{ flex: 1 }}>
          <AppText variant="small" muted>{t('student.tuitionStatus')}</AppText>
          <AppText variant="bodyMedium">{`${formatMoney(f.total_paid)} / ${formatMoney(f.total_charged)}`}</AppText>
        </View>
        <FinancialBadge status={f.status} />
      </Card>

      {data.terms.length ? (
        <>
          <SectionHeader title={t('student.myTerms')} />
          {data.terms.map((term, i) => (
            <Card key={term.term_id} index={i} style={{ gap: 6 }}>
              <AppText variant="bodyMedium">{term.term_title}</AppText>
              {term.total_sessions ? (
                <>
                  <AppText variant="small" muted>{t('students.usedSessions', { u: digits(term.used_sessions), t: digits(term.total_sessions) })}</AppText>
                  <ProgressBar value={term.used_sessions / term.total_sessions} />
                </>
              ) : <AppText variant="small" muted>{t(`terms.status.${term.status}`, { defaultValue: '' })}</AppText>}
            </Card>
          ))}
        </>
      ) : null}

      <SectionHeader title={t('dashboard.upcoming')} action={t('common.calendar')} onAction={() => router.push('/student/calendar')} />
      {data.upcoming_sessions.length ? data.upcoming_sessions.slice(0, 4).map((s, i) => (
        <SessionCard key={s.id} session={s} index={i} showDate={formatRelativeDay(s.start_at)} onPress={() => router.push(`/student/session/${s.id}`)} />
      )) : <Card><EmptyState icon="calendar-blank-outline" title={t('dashboard.noUpcoming')} /></Card>}

      {data.training_plans.length ? (
        <>
          <SectionHeader title={t('training.myPlan')} />
          {data.training_plans.slice(0, 2).map((p, i) => <PlanCard key={p.id} plan={p} index={i} onPress={() => router.push(`/student/training/${p.id}`)} />)}
        </>
      ) : null}

      {data.session_history.length ? (
        <>
          <SectionHeader title={t('student.history')} />
          {data.session_history.slice(0, 5).map((s, i) => (
            <SessionCard key={s.id} session={s} index={i} showDate={formatDate(s.start_at, 'D MMMM')} onPress={() => router.push(`/student/session/${s.id}`)} />
          ))}
        </>
      ) : null}
      <AppText variant="caption" muted align="center" style={{ color: colors.textSubtle }}>{t('student.privacy')}</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
