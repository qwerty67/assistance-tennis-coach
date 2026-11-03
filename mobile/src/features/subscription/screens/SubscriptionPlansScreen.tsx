import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCurrentSubscription, useSubscriptionPlans } from '../api';
import { PlanCard } from '../components/PlanCard';
import { useAuth } from '@/features/auth/store';
import {
  AppText,
  Badge,
  Button,
  Card,
  Header,
  Icon,
  IconButton,
  LoadingView,
  PressableScale,
  Screen,
  SectionHeader,
} from '@/shared/components';
import { useRefresh } from '@/shared/hooks/useRefresh';
import { colors, palette, radius, shadows, spacing } from '@/shared/theme';
import { digits, formatDate, formatMoney } from '@/shared/utils/format';
import { confirm } from '@/shared/utils/confirm';
import type { SubscriptionTier } from '@/shared/types/api';

export function SubscriptionPlansScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { data: plans, isLoading, refetch } = useSubscriptionPlans();
  const { data: currentSub, refetch: refetchCurrent } = useCurrentSubscription(user?.role === 'coach');
  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([refetch(), refetchCurrent()]);
  });

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('3_months');

  if (isLoading) return <LoadingView />;

  const selectedPlan = plans?.find((p) => p.tier === selectedTier) ?? plans?.[1] ?? plans?.[0];

  const handleContinue = () => {
    if (!selectedPlan) return;
    router.push(`/coach/subscription/payment?plan=${selectedPlan.tier}`);
  };

  const handleLogout = async () => {
    if (await confirm(t('profile.logoutConfirm'))) {
      await logout();
      router.replace('/login');
    }
  };

  const canGoBack = router.canGoBack() && user?.has_active_subscription;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={
        <Header
          back={canGoBack}
          title={t('subscription.title')}
          right={
            <IconButton
              icon="logout"
              onPress={handleLogout}
              color={colors.textMuted}
            />
          }
        />
      }
    >
      {/* Hero Welcome Card */}
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIconBox}>
            <Icon name="whistle-outline" size={28} color={palette.lime400} />
          </View>
          <View style={styles.heroText}>
            <AppText variant="h2" color={colors.textInverse}>
              {t('subscription.title')}
            </AppText>
            <AppText variant="small" style={styles.heroSubtitle}>
              {t('subscription.subtitle')}
            </AppText>
          </View>
        </View>

        {/* Existing Subscription Info if active */}
        {currentSub?.is_active && (
          <View style={styles.currentSubBox}>
            <View style={styles.currentSubRow}>
              <Badge
                label={t('common.done')}
                color={colors.primaryDark}
                bg={colors.primarySoft}
              />
              <AppText variant="small" color={colors.textInverse}>
                {t('subscription.activeUntil', {
                  date: currentSub.expires_at ? formatDate(currentSub.expires_at) : '-',
                })}
              </AppText>
            </View>
            <AppText variant="caption" color={palette.gray300}>
              {t('subscription.daysRemaining', { n: digits(currentSub.days_left ?? 0) })} · خرید اشتراک جدید مدت زمان را تمدید خواهد کرد.
            </AppText>
          </View>
        )}
      </Card>

      {/* Plans Section */}
      <SectionHeader title={t('subscription.selectPlan')} />
      <View style={styles.plansList}>
        {plans?.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedTier === plan.tier}
            onSelect={() => setSelectedTier(plan.tier)}
          />
        ))}
      </View>

      {/* Selected Plan Summary & Proceed Button */}
      {selectedPlan && (
        <Card style={styles.actionCard}>
          <View style={styles.actionSummaryRow}>
            <View>
              <AppText variant="caption" muted>
                {t('subscription.checkout.planName')}
              </AppText>
              <AppText variant="h3">{selectedPlan.title}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="caption" muted>
                {t('subscription.checkout.totalPayable')}
              </AppText>
              <AppText variant="h2" color={colors.primaryDark}>
                {formatMoney(selectedPlan.price)}
              </AppText>
            </View>
          </View>

          <Button
            title={t('subscription.continueToPayment')}
            onPress={handleContinue}
            size="lg"
            variant="navy"
            icon="arrow-left"
          />
        </Card>
      )}

      {/* Why Choose Tennis Coach Card */}
      <SectionHeader title={t('subscription.benefitsTitle')} />
      <Card style={styles.benefitsCard}>
        {[
          'مدیریت یکپارچه شاگردان، کلاس‌ها و ترم‌ها',
          'حسابداری خودکار، تسویه شهریه و پیگیری بدهی‌ها',
          'ثبت جلسات و حضور و غیاب آنلاین و آفلاین',
          'برنامه‌ریزی تمرینی اختصاصی و سیستم جبرانی جلسات',
        ].map((benefit, idx) => (
          <View key={idx} style={styles.benefitRow}>
            <View style={styles.benefitDot}>
              <Icon name="check" size={14} color={colors.primary} />
            </View>
            <AppText variant="small" style={{ flex: 1 }}>
              {benefit}
            </AppText>
          </View>
        ))}
      </Card>

      {/* Logout Option */}
      <View style={styles.footerLogout}>
        <PressableScale onPress={handleLogout}>
          <AppText variant="caption" muted align="center">
            {t('profile.logout')}
          </AppText>
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: palette.navy900,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.navy700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroSubtitle: {
    color: palette.gray300,
    lineHeight: 20,
  },
  currentSubBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  currentSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  plansList: {
    gap: spacing.md,
  },
  actionCard: {
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.floating,
  },
  actionSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  benefitsCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogout: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
