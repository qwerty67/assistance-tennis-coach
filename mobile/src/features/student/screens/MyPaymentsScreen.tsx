import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMyAccounts } from '@/features/finance/api';
import { AppText, Badge, Card, ChargeBadge, EmptyState, ErrorView, FinancialBadge, Header, KeyValue, ListRow, Screen, SectionHeader, SkeletonList } from '@/shared/components';
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
          <View key={acc.student_id} style={{ gap: spacing.md, marginBottom: spacing.xl }}>
            {/* Account Overview Card */}
            <Card style={{ gap: spacing.xs, borderTopWidth: 4, borderTopColor: c.main }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <View style={{ gap: 2 }}>
                  <AppText variant="h3">{t('student.myAccount')}</AppText>
                  {acc.coach_name ? (
                    <AppText variant="caption" muted>{t('student.coachName', { name: acc.coach_name })}</AppText>
                  ) : null}
                </View>
                <FinancialBadge status={acc.status} />
              </View>

              <KeyValue label={t('finance.totalTuition')} value={formatMoney(acc.total_tuition)} />
              <KeyValue label={t('finance.paid')} value={formatMoney(acc.paid_amount)} color={colors.primaryDark} />
              <KeyValue label={t('finance.remaining')} value={formatMoney(acc.remaining_amount)} strong color={acc.remaining_amount ? colors.danger : colors.success} />
              {acc.credit ? <KeyValue label={t('finance.credit')} value={formatMoney(acc.credit)} color={colors.info} /> : null}
              {acc.number_of_sessions ? (
                <KeyValue label={t('finance.sessions')} value={t('students.usedSessions', { u: digits(acc.used_sessions), t: digits(acc.number_of_sessions) })} />
              ) : null}
            </Card>

            {/* Debts by Class */}
            {acc.debts_by_class && acc.debts_by_class.length > 0 ? (
              <>
                <SectionHeader title={t('finance.debtsByClass')} />
                <View style={{ gap: spacing.sm }}>
                  {acc.debts_by_class.map((item) => {
                    const isSettled = item.debt <= 0;
                    const classColor = item.color || colors.primary;
                    return (
                      <Card key={item.class_id ?? 'standalone'} style={{ borderLeftWidth: 4, borderLeftColor: classColor, padding: spacing.md, gap: spacing.xs }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: classColor }} />
                            <AppText variant="bodyMedium" style={{ fontWeight: '600' }}>{item.class_name}</AppText>
                          </View>
                          {isSettled ? (
                            <Badge label={t('finance.status.settled')} color={colors.success} bg={colors.successSoft} />
                          ) : (
                            <Badge label={formatMoney(item.debt)} color={colors.danger} bg={colors.dangerSoft} />
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                          <AppText variant="caption" muted>
                            {t('finance.charged')}: {formatMoney(item.charged)}
                          </AppText>
                          <AppText variant="caption" muted>
                            {t('finance.received')}: {formatMoney(item.paid)}
                          </AppText>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              </>
            ) : null}

            {/* Charges */}
            <SectionHeader title={t('finance.charges')} count={acc.charges.length} />
            <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
              {acc.charges.length ? acc.charges.map((ch, i) => {
                const title = ch.description || t(`finance.kind.${ch.kind}`);
                const classPrefix = ch.class_name ? `[${ch.class_name}] ` : '';
                const dateText = ch.due_date ? ` · ${t('finance.due', { d: formatDate(ch.due_date) })}` : '';
                const subtitle = `${classPrefix}${formatMoney(ch.amount)}${dateText}`;

                return (
                  <ListRow
                    key={ch.id}
                    title={title}
                    subtitle={subtitle}
                    right={<ChargeBadge status={ch.status} />}
                    divider={i < acc.charges.length - 1}
                  />
                );
              }) : <EmptyState icon="receipt" title={t('finance.noCharges')} />}
            </Card>

            {/* Payments */}
            <SectionHeader title={t('finance.payments')} count={acc.payments.length} />
            <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
              {acc.payments.length ? acc.payments.map((p, i) => {
                const classPart = p.class_name ? `${p.class_name} · ` : '';
                const refPart = p.reference_no ? ` · #${p.reference_no}` : '';
                const subtitle = `${classPart}${formatDate(p.paid_at)} · ${t(`finance.method.${p.method}`)}${refPart}`;

                return (
                  <ListRow
                    key={p.id}
                    icon="cash-check"
                    title={formatMoney(p.amount)}
                    subtitle={subtitle}
                    divider={i < acc.payments.length - 1}
                  />
                );
              }) : <EmptyState icon="cash-remove" title={t('finance.noPayments')} />}
            </Card>
          </View>
        );
      }) : <EmptyState icon="wallet-outline" title={t('student.notLinked')} />}
    </Screen>
  );
}
