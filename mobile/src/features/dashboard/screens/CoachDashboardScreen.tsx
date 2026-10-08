import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useCoachDashboard } from '../api';
import { NextSessionHero } from '../components/NextSessionHero';
import { QuickActions } from '../components/QuickActions';
import { ReminderList } from '../components/ReminderList';
import { SessionCard } from '@/features/sessions/components/SessionCard';
import { useAuth } from '@/features/auth/store';
import { useUnreadCount } from '@/features/notifications/api';
import {
  AppText, Avatar, BarChart, Card, EmptyState, ErrorView, FinancialBadge, IconButton, ListRow, PressableScale, Screen,
  SectionHeader, SkeletonList, StatCard,
} from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney, formatMoneyShort, formatRelativeDay, jalaliMonthName } from '@/shared/utils/format';
import { useRefresh } from '@/shared/hooks/useRefresh';

export function CoachDashboardScreen() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const { data, isLoading, error, refetch } = useCoachDashboard();
  const unread = useUnreadCount();
  const { refreshing, onRefresh } = useRefresh(refetch, unread.refetch);

  const hour = dayjs().hour();
  const greeting = hour < 12 ? t('dashboard.goodMorning') : hour < 17 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening');

  const header = (
    <View style={styles.header}>
      <PressableScale onPress={() => router.push('/coach/profile')}>
        <Avatar name={`${user?.first_name} ${user?.last_name}`} size={46} />
      </PressableScale>
      <View style={{ flex: 1 }}>
        <AppText variant="small" muted>{`${greeting} · ${formatDate(new Date(), 'dddd D MMMM')}`}</AppText>
        <AppText variant="h2">{t('dashboard.coachName', { name: user?.first_name })}</AppText>
      </View>
      <IconButton icon="bell-outline" badge={unread.data?.count} onPress={() => router.push('/notifications')} />
    </View>
  );

  if (error) return <Screen header={header}><ErrorView error={error} onRetry={refetch} /></Screen>;

  return (
    <Screen header={header} refreshing={refreshing} onRefresh={onRefresh}>
      {isLoading || !data ? (
        <SkeletonList rows={5} />
      ) : (
        <>
          <NextSessionHero session={data.next_session} onOpen={data.next_session ? () => router.push(`/coach/session/${data.next_session!.id}`) : undefined} />

          <QuickActions actions={[
            { icon: 'account-plus-outline', label: t('dashboard.qa.student'), onPress: () => router.push('/coach/student/form') },
            { icon: 'calendar-plus', label: t('dashboard.qa.session'), onPress: () => router.push('/coach/session/form') },
            { icon: 'cash-plus', label: t('dashboard.qa.payment'), onPress: () => router.push('/coach/payment/new'), tint: colors.primaryDark, soft: colors.primarySoft },
            { icon: 'calendar-refresh-outline', label: t('dashboard.qa.makeup'), onPress: () => router.push('/coach/makeups') },
          ]} />

          <View style={styles.grid}>
            <StatCard icon="account-group-outline" label={t('dashboard.stats.students')} value={digits(data.students.active)} hint={t('dashboard.stats.classes', { n: digits(data.classes_count) })} onPress={() => router.push('/coach/students')} />
            <StatCard icon="calendar-today" label={t('dashboard.stats.today')} value={digits(data.today_sessions.length)} tint={colors.info} soft={colors.infoSoft} hint={t('dashboard.stats.todayClasses', { n: digits(data.today_classes) })} onPress={() => router.push('/coach/calendar')} />
          </View>
          <View style={styles.grid}>
            <StatCard icon="trending-up" label={t('dashboard.stats.monthIncome')} value={formatMoneyShort(data.month_income)} tint={colors.primaryDark} soft={colors.primarySoft} onPress={() => router.push('/coach/finance')} />
            <StatCard icon="alert-circle-outline" label={t('dashboard.stats.outstanding')} value={formatMoneyShort(data.outstanding)} tint={colors.danger} soft={colors.dangerSoft} hint={t('dashboard.stats.debtors', { n: digits(data.debtors_count) })} onPress={() => router.push('/coach/finance')} />
          </View>

          {data.reminders.length ? (<><SectionHeader title={t('dashboard.reminders')} /><ReminderList reminders={data.reminders} /></>) : null}

          <SectionHeader title={t('dashboard.todaySessions')} count={data.today_sessions.length} action={t('common.calendar')} onAction={() => router.push('/coach/calendar')} />
          {data.today_sessions.length ? (
            data.today_sessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} onPress={() => router.push(`/coach/session/${s.id}`)} />)
          ) : (
            <Card><EmptyState icon="tennis" title={t('dashboard.noSessionsToday')} actionLabel={t('dashboard.qa.session')} onAction={() => router.push('/coach/session/form')} /></Card>
          )}

          {data.upcoming_sessions.length ? (
            <>
              <SectionHeader title={t('dashboard.upcoming')} />
              {data.upcoming_sessions.slice(0, 4).map((s, i) => (
                <SessionCard key={s.id} session={s} index={i} showDate={formatRelativeDay(s.start_at)} onPress={() => router.push(`/coach/session/${s.id}`)} />
              ))}
            </>
          ) : null}

          {data.low_remaining.length ? (
            <>
              <SectionHeader title={t('dashboard.lowRemaining')} />
              <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
                {data.low_remaining.map((x, i) => (
                  <ListRow key={x.term_id + x.student_id} left={<Avatar name={x.name} size={38} />} title={x.name} subtitle={x.term_title}
                    right={<AppText variant="bodyMedium" color={x.remaining <= 1 ? colors.danger : colors.warning}>{t('dashboard.remainingOf', { r: digits(x.remaining), t: digits(x.total) })}</AppText>}
                    onPress={() => router.push(`/coach/student/${x.student_id}`)} divider={i < data.low_remaining.length - 1} />
                ))}
              </Card>
            </>
          ) : null}

          <SectionHeader title={t('dashboard.debtors')} count={data.debtors_count} action={t('common.seeAll')} onAction={() => router.push('/coach/finance')} />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {data.debtors.length ? data.debtors.slice(0, 5).map((d, i) => (
              <ListRow key={d.student_id} left={<Avatar name={d.name} size={38} />} title={d.name} subtitle={formatMoney(d.debt)} right={<FinancialBadge status={d.status} />}
                onPress={() => router.push(`/coach/student/${d.student_id}`)} divider={i < Math.min(5, data.debtors.length) - 1} />
            )) : <EmptyState icon="check-decagram-outline" title={t('dashboard.noDebtors')} />}
          </Card>

          <SectionHeader title={t('dashboard.incomeTrend')} />
          <Card>
            <BarChart data={data.monthly.map((m, i) => ({ label: jalaliMonthName(m.label_month), value: m.received, highlight: i === data.monthly.length - 1 }))} />
          </Card>

          <SectionHeader title={t('dashboard.recentPayments')} action={t('common.seeAll')} onAction={() => router.push('/coach/finance')} />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {data.recent_payments.length ? data.recent_payments.map((p, i) => (
              <ListRow key={p.id} icon="cash-check" title={p.student_name ?? ''} subtitle={`${formatDate(p.paid_at)} · ${t(`finance.method.${p.method}`)}`}
                right={<AppText variant="bodyMedium" color={colors.primaryDark}>{formatMoney(p.amount)}</AppText>} divider={i < data.recent_payments.length - 1} />
            )) : <EmptyState icon="cash-remove" title={t('finance.noPayments')} />}
          </Card>

          {data.cancelled_count ? (
            <Card tone="muted" onPress={() => router.push('/coach/makeups')}>
              <AppText variant="bodyMedium">{t('dashboard.cancelledInfo', { n: digits(data.cancelled_count), m: digits(data.pending_makeups) })}</AppText>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  grid: { flexDirection: 'row', gap: spacing.md },
});
