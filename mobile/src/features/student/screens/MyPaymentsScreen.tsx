import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMyAccounts } from '@/features/finance/api';
import { AppText, Card, ChargeBadge, EmptyState, ErrorView, FinancialBadge, Header, KeyValue, ListRow, Screen, SectionHeader, SkeletonList } from '@/shared/components';
import { colors, financialStatusColors, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney } from '@/shared/utils/format';

export function MyPaymentsScreen() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useMyAccounts();
  return (
    <Screen onRefresh={refetch} header={<Header large title={t('nav.payments')} />}>
      {error ? <ErrorView error={error} onRetry={refetch} /> : isLoading ? <SkeletonList /> : data?.length ? data.map((acc) => {
        const c = financialStatusColors[acc.status];
        return (
          <View key={acc.student_id} style={{ gap: spacing.md }}>
            <Card style={{ gap: 2, borderTopWidth: 4, borderTopColor: c.main }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <AppText variant="h3">{t('student.myAccount')}</AppText>
                <FinancialBadge status={acc.status} />
              </View>
              <KeyValue label={t('finance.totalTuition')} value={formatMoney(acc.total_tuition)} />
              <KeyValue label={t('finance.paid')} value={formatMoney(acc.paid_amount)} color={colors.primaryDark} />
              <KeyValue label={t('finance.remaining')} value={formatMoney(acc.remaining_amount)} strong color={acc.remaining_amount ? colors.danger : undefined} />
              {acc.credit ? <KeyValue label={t('finance.credit')} value={formatMoney(acc.credit)} color={colors.info} /> : null}
              {acc.number_of_sessions ? <KeyValue label={t('finance.sessions')} value={t('students.usedSessions', { u: digits(acc.used_sessions), t: digits(acc.number_of_sessions) })} /> : null}
            </Card>
            <SectionHeader title={t('finance.charges')} />
            <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
              {acc.charges.length ? acc.charges.map((ch, i) => (
                <ListRow key={ch.id} title={ch.description || t(`finance.kind.${ch.kind}`)} subtitle={`${formatMoney(ch.amount)}${ch.due_date ? ' · ' + t('finance.due', { d: formatDate(ch.due_date) }) : ''}`}
                  right={<ChargeBadge status={ch.status} />} divider={i < acc.charges.length - 1} />
              )) : <EmptyState icon="receipt" title={t('finance.noCharges')} />}
            </Card>
            <SectionHeader title={t('finance.payments')} />
            <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
              {acc.payments.length ? acc.payments.map((p, i) => (
                <ListRow key={p.id} icon="cash-check" title={formatMoney(p.amount)} subtitle={`${formatDate(p.paid_at)} · ${t(`finance.method.${p.method}`)}`} divider={i < acc.payments.length - 1} />
              )) : <EmptyState icon="cash-remove" title={t('finance.noPayments')} />}
            </Card>
          </View>
        );
      }) : <EmptyState icon="wallet-outline" title={t('student.notLinked')} />}
    </Screen>
  );
}
