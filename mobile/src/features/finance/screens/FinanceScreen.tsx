import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFinanceSummary, usePayments, useVoidPayment } from '../api';
import {
  AppText, Avatar, BarChart, Card, Chips, DonutChart, EmptyState, ErrorView, Fab, FinancialBadge, HBarList, Header, KeyValue, ListRow, Screen,
  SectionHeader, SegmentedControl, SkeletonList, StatCard,
} from '@/shared/components';
import { classTypeColors, colors, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney, formatMoneyShort, jalaliMonthName } from '@/shared/utils/format';
import { confirm } from '@/shared/utils/confirm';
import { useRefresh } from '@/shared/hooks/useRefresh';

type Tab = 'overview' | 'payments' | 'debts';

export function FinanceScreen() {
  const { t } = useTranslation();
  const [months, setMonths] = useState(6);
  const [tab, setTab] = useState<Tab>('overview');
  const { data, isLoading, error, refetch } = useFinanceSummary(months);
  const payments = usePayments({ limit: 100 });
  const voidPayment = useVoidPayment();
  const { refreshing, onRefresh } = useRefresh(refetch, payments.refetch);

  return (
    <Screen overlay={<Fab icon="cash-plus" label={t('finance.recordPayment')} onPress={() => router.push('/coach/payment/new')} />} refreshing={refreshing} onRefresh={onRefresh} header={<Header large title={t('finance.title')} />}>
      {error ? <ErrorView error={error} onRetry={refetch} /> : isLoading || !data ? <SkeletonList /> : (
        <>
          <Card tone="navy" style={{ gap: spacing.xs }}>
            <AppText variant="small" color="rgba(255,255,255,0.7)">{t('finance.monthIncome')}</AppText>
            <AppText variant="display" color={colors.textInverse}>{formatMoney(data.month_income)}</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
              <View><AppText variant="caption" color="rgba(255,255,255,0.6)">{t('finance.coachShare')}</AppText><AppText variant="bodyMedium" color={colors.accent}>{formatMoneyShort(data.coach_income)}</AppText></View>
              <View><AppText variant="caption" color="rgba(255,255,255,0.6)">{t('classes.courtCost')}</AppText><AppText variant="bodyMedium" color={colors.textInverse}>{formatMoneyShort(data.court_cost)}</AppText></View>
              <View><AppText variant="caption" color="rgba(255,255,255,0.6)">{t('finance.yearIncome')}</AppText><AppText variant="bodyMedium" color={colors.textInverse}>{formatMoneyShort(data.year_income)}</AppText></View>
            </View>
          </Card>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatCard icon="alert-circle-outline" label={t('finance.outstanding')} value={formatMoneyShort(data.outstanding)} tint={colors.danger} soft={colors.dangerSoft} hint={t('dashboard.stats.debtors', { n: digits(data.debtors_count) })} />
            <StatCard icon="piggy-bank-outline" label={t('finance.credit')} value={formatMoneyShort(data.total_credit)} tint={colors.info} soft={colors.infoSoft} />
          </View>

          <SegmentedControl<Tab> value={tab} onChange={setTab} options={[
            { value: 'overview', label: t('finance.tabs.reports') }, { value: 'payments', label: t('finance.tabs.payments') }, { value: 'debts', label: t('finance.tabs.debts') },
          ]} />

          {tab === 'overview' ? (
            <>
              <Chips size="sm" value={months} onChange={setMonths} options={[3, 6, 12].map((m) => ({ value: m, label: t('finance.lastMonths', { n: digits(m) }) }))} />
              <SectionHeader title={t('finance.monthlyIncome')} />
              <Card>
                <BarChart data={data.monthly.map((m, i) => ({ label: jalaliMonthName(m.label_month), value: m.received, secondary: m.charged, highlight: i === data.monthly.length - 1 }))} />
                <View style={{ flexDirection: 'row', gap: spacing.lg, justifyContent: 'center', marginTop: spacing.sm }}>
                  <AppText variant="caption" color={colors.primary}>{`● ${t('finance.received')}`}</AppText>
                  <AppText variant="caption" muted>{`● ${t('finance.charged')}`}</AppText>
                </View>
              </Card>
              <SectionHeader title={t('finance.byClassType')} />
              <Card style={{ alignItems: 'center' }}>
                <DonutChart centerLabel={t('finance.charged')} centerValue={formatMoneyShort(data.charged)}
                  data={data.by_class_type.map((x) => ({ label: t(`classes.type.${x.class_type}`), value: x.charged, color: classTypeColors[x.class_type]?.main ?? colors.textSubtle }))} />
              </Card>
              <SectionHeader title={t('finance.byStudent')} />
              <Card><HBarList data={data.by_student.slice(0, 8).map((x) => ({ label: x.name, value: x.received }))} /></Card>
              <SectionHeader title={t('finance.byMethod')} />
              <Card style={{ gap: 2 }}>
                {data.by_method.length ? data.by_method.map((m) => <KeyValue key={m.method} label={t(`finance.method.${m.method}`)} value={formatMoney(m.amount)} />) : <AppText muted>—</AppText>}
              </Card>
              <SectionHeader title={t('finance.byClass')} />
              <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
                {data.by_class.map((c, i) => (
                  <ListRow key={c.class_id} title={c.name} subtitle={`${t('finance.charged')}: ${formatMoney(c.charged)}`} right={<AppText variant="bodyMedium" color={colors.primaryDark}>{formatMoneyShort(c.received)}</AppText>}
                    onPress={() => router.push(`/coach/class/${c.class_id}`)} divider={i < data.by_class.length - 1} />
                ))}
              </Card>
            </>
          ) : null}

          {tab === 'payments' ? (
            <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
              {payments.data?.length ? payments.data.map((p, i) => (
                <ListRow key={p.id} icon="cash-check" title={p.student_name ?? ''} subtitle={`${formatDate(p.paid_at)} · ${t(`finance.method.${p.method}`)}${p.description ? ' · ' + p.description : ''}`}
                  right={<AppText variant="bodyMedium" color={colors.primaryDark}>{formatMoney(p.amount)}</AppText>}
                  onPress={async () => { if (await confirm(t('finance.voidConfirm'), formatMoney(p.amount), true)) voidPayment.mutate(p.id); }}
                  chevron={false} divider={i < payments.data!.length - 1} />
              )) : <EmptyState icon="cash-remove" title={t('finance.noPayments')} />}
            </Card>
          ) : null}

          {tab === 'debts' ? (
            <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
              {data.debtors.length ? data.debtors.map((x, i) => (
                <ListRow key={x.student_id} left={<Avatar name={x.name} size={38} />} title={x.name}
                  subtitle={`${t('finance.debt')}: ${formatMoney(x.debt)}${x.overdue ? ' · ' + t('finance.overdue') + ': ' + formatMoney(x.overdue) : ''}`}
                  right={<FinancialBadge status={x.status} />} onPress={() => router.push(`/coach/payment/new?studentId=${x.student_id}`)} divider={i < data.debtors.length - 1} />
              )) : <EmptyState icon="check-decagram-outline" title={t('dashboard.noDebtors')} />}
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
