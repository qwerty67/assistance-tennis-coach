import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSubscriptionPlans, useSubscribe } from '../api';
import { useAuth } from '@/features/auth/store';
import {
  AppText,
  Badge,
  Button,
  Card,
  Header,
  Icon,
  LoadingView,
  Screen,
  SectionHeader,
} from '@/shared/components';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { colors, palette, radius, shadows, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney } from '@/shared/utils/format';
import { errorMessage } from '@/shared/utils/errors';
import type { SubscriptionTier } from '@/shared/types/api';

export function SubscriptionPaymentScreen() {
  const { t } = useTranslation();
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();
  const { user, updateUserSubscription, reloadUser } = useAuth();
  const { data: plans, isLoading } = useSubscriptionPlans();
  const subscribe = useSubscribe();
  const fb = useFeedback();

  const [isSuccess, setIsSuccess] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  if (isLoading) return <LoadingView />;

  const selectedPlan =
    plans?.find((p) => p.tier === planParam) ??
    plans?.find((p) => p.is_popular) ??
    plans?.[0];

  if (!selectedPlan) {
    return (
      <Screen header={<Header back title={t('subscription.checkout.title')} />}>
        <Card>
          <AppText>{t('errors.not_found')}</AppText>
          <Button title={t('common.retry')} onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  const discountAmount = Math.max(0, selectedPlan.original_price - selectedPlan.price);

  const onPay = async () => {
    try {
      const res = await subscribe.mutateAsync({
        plan_tier: selectedPlan.tier as SubscriptionTier,
        payment_method: 'shaparak_mock',
      });

      // Update auth store with active subscription
      await updateUserSubscription(true, res.subscription.expires_at);
      await reloadUser();

      setRefCode(res.subscription.payment_reference ?? 'SUB-OK');
      setExpiresAt(res.subscription.expires_at ?? null);
      setIsSuccess(true);

      fb.success(t('subscription.checkout.successTitle'), true);
    } catch (e) {
      fb.error(errorMessage(e));
    }
  };

  const onEnterApp = () => {
    router.replace('/coach');
  };

  return (
    <Screen
      header={
        <Header
          back={!isSuccess}
          title={t('subscription.checkout.title')}
        />
      }
    >
      {isSuccess ? (
        /* Payment Success View */
        <Card style={styles.successCard}>
          <View style={styles.successIconWrapper}>
            <Icon name="check-circle" size={56} color={colors.primary} />
          </View>

          <AppText variant="h2" align="center" style={{ fontWeight: '700' }}>
            {t('subscription.checkout.successTitle')}
          </AppText>

          <AppText variant="body" color={colors.textMuted} align="center" style={styles.successDesc}>
            {t('subscription.checkout.successDesc')}
          </AppText>

          <View style={styles.successDetailsBox}>
            <View style={styles.detailRow}>
              <AppText variant="caption" muted>
                {t('subscription.checkout.planName')}
              </AppText>
              <AppText variant="bodyMedium">{selectedPlan.title}</AppText>
            </View>

            <View style={styles.detailRow}>
              <AppText variant="caption" muted>
                {t('subscription.checkout.duration')}
              </AppText>
              <AppText variant="bodyMedium">
                {t('subscription.daysCount', { n: digits(selectedPlan.duration_days) })}
              </AppText>
            </View>

            <View style={styles.detailRow}>
              <AppText variant="caption" muted>
                {t('subscription.activeUntil', { date: '' }).replace('{{date}}', '')}
              </AppText>
              <AppText variant="bodyMedium" color={colors.primaryDark}>
                {expiresAt ? formatDate(expiresAt) : '-'}
              </AppText>
            </View>

            {refCode && (
              <View style={styles.detailRow}>
                <AppText variant="caption" muted>
                  کد رهگیری تراکنش
                </AppText>
                <AppText variant="bodyMedium" style={{ fontFamily: 'monospace', writingDirection: 'ltr' }}>
                  {refCode}
                </AppText>
              </View>
            )}
          </View>

          <Button
            title={t('subscription.checkout.enterApp')}
            onPress={onEnterApp}
            size="lg"
            variant="primary"
            icon="arrow-left"
          />
        </Card>
      ) : (
        /* Checkout View */
        <>
          {/* Order Summary */}
          <SectionHeader title={t('subscription.checkout.orderSummary')} />
          <Card style={styles.orderCard}>
            <View style={styles.planHeaderRow}>
              <View style={styles.planIconBox}>
                <Icon name="medal-outline" size={26} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="h3">{selectedPlan.title}</AppText>
                <AppText variant="caption" muted>
                  {t('subscription.daysCount', { n: digits(selectedPlan.duration_days) })}
                </AppText>
              </View>
              {selectedPlan.badge && (
                <Badge
                  label={selectedPlan.badge}
                  color={selectedPlan.is_popular ? colors.primaryDark : palette.blue500}
                  bg={selectedPlan.is_popular ? colors.primarySoft : palette.blue100}
                />
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <AppText variant="small" muted>
                {t('subscription.checkout.subtotal')}
              </AppText>
              <AppText variant="small">
                {formatMoney(selectedPlan.original_price)}
              </AppText>
            </View>

            {discountAmount > 0 && (
              <View style={styles.detailRow}>
                <AppText variant="small" color={colors.primaryDark}>
                  {t('subscription.checkout.discount')}
                </AppText>
                <AppText variant="small" color={colors.primaryDark}>
                  {formatMoney(discountAmount)} -
                </AppText>
              </View>
            )}

            <View style={styles.detailRow}>
              <AppText variant="small" muted>
                {t('subscription.checkout.tax')}
              </AppText>
              <AppText variant="small" color={colors.primary}>
                {t('subscription.checkout.freeTax')}
              </AppText>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <AppText variant="h3">{t('subscription.checkout.totalPayable')}</AppText>
              <AppText variant="h2" color={colors.primaryDark}>
                {formatMoney(selectedPlan.price)}
              </AppText>
            </View>
          </Card>

          {/* Coach Details */}
          <SectionHeader title={t('subscription.checkout.coachInfo')} />
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="account-outline" size={20} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" muted>
                  {t('subscription.checkout.coachName')}
                </AppText>
                <AppText variant="bodyMedium">
                  {user ? `${user.first_name} ${user.last_name}` : '-'}
                </AppText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="phone-outline" size={20} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" muted>
                  {t('subscription.checkout.coachPhone')}
                </AppText>
                <AppText variant="bodyMedium" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                  {user?.phone ? digits(user.phone) : '-'}
                </AppText>
              </View>
            </View>

            {user?.email && (
              <View style={styles.infoRow}>
                <Icon name="email-outline" size={20} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" muted>
                    {t('subscription.checkout.coachEmail')}
                  </AppText>
                  <AppText variant="bodyMedium" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                    {user.email}
                  </AppText>
                </View>
              </View>
            )}
          </Card>

          {/* Payment Gateway Card */}
          <SectionHeader title={t('subscription.checkout.gatewayTitle')} />
          <Card style={styles.gatewayCard}>
            <View style={styles.gatewayHeader}>
              <View style={styles.gatewayIconBox}>
                <Icon name="credit-card-outline" size={24} color={palette.blue500} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium" style={{ fontWeight: '600' }}>
                  {t('subscription.checkout.shaparakGateway')}
                </AppText>
                <AppText variant="caption" color={colors.primaryDark}>
                  {t('subscription.checkout.securityGuarantee')}
                </AppText>
              </View>
              <Icon name="shield-check" size={22} color={colors.primary} />
            </View>

            {/* Simulated gateway explanation */}
            <View style={styles.simulatedNoticeBox}>
              <Icon name="information-outline" size={18} color={palette.amber500} />
              <AppText variant="caption" color={palette.gray700} style={{ flex: 1 }}>
                {t('subscription.checkout.simulatedNotice')}
              </AppText>
            </View>
          </Card>

          {/* Pay Button */}
          <View style={styles.payActionContainer}>
            <Button
              title={t('subscription.checkout.payAndActivate')}
              onPress={onPay}
              loading={subscribe.isPending}
              size="lg"
              variant="navy"
              icon="lock-check"
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  orderCard: {
    gap: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  infoCard: {
    gap: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gatewayCard: {
    gap: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: palette.blue100,
    backgroundColor: '#F8FAFF',
  },
  gatewayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gatewayIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.amber100,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  payActionContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  successCard: {
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    ...shadows.floating,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDesc: {
    lineHeight: 22,
  },
  successDetailsBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
