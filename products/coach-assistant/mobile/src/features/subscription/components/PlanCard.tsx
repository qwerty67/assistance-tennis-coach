import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Badge, Card, Icon, PressableScale } from '@/shared/components';
import { colors, palette, radius, spacing } from '@/shared/theme';
import { digits, formatMoney } from '@/shared/utils/format';
import type { SubscriptionPlan } from '@/shared/types/api';

interface PlanCardProps {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const { t } = useTranslation();

  const isPopular = plan.is_popular;
  const hasDiscount = plan.discount_percent > 0;

  return (
    <PressableScale onPress={onSelect}>
      <Card
        style={[
          styles.card,
          selected && styles.selectedCard,
          isPopular && !selected && styles.popularCard,
        ]}
      >
        {/* Top Badges */}
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            {plan.badge && (
              <Badge
                label={plan.badge}
                color={isPopular ? colors.primaryDark : palette.blue500}
                bg={isPopular ? colors.primarySoft : palette.blue100}
              />
            )}
            {hasDiscount && (
              <Badge
                label={t('subscription.savePercent', { n: digits(plan.discount_percent) })}
                color={palette.amber500}
                bg={palette.amber100}
              />
            )}
          </View>
          {/* Radio indicator */}
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected && <View style={styles.radioInner} />}
          </View>
        </View>

        {/* Plan Header */}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <AppText variant="h2" style={styles.title}>
              {plan.title}
            </AppText>
            <AppText variant="caption" muted>
              {t('subscription.daysCount', { n: digits(plan.duration_days) })}
            </AppText>
          </View>

          {/* Pricing */}
          <View style={styles.priceContainer}>
            {hasDiscount && (
              <AppText variant="caption" style={styles.originalPrice}>
                {formatMoney(plan.original_price)}
              </AppText>
            )}
            <View style={styles.finalPriceRow}>
              <AppText variant="h2" color={selected ? colors.primaryDark : colors.text}>
                {formatMoney(plan.price)}
              </AppText>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Features List */}
        <View style={styles.features}>
          {plan.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Icon
                name="check-circle"
                size={18}
                color={selected ? colors.primary : colors.primaryDark}
              />
              <AppText variant="small" style={styles.featureText}>
                {feature}
              </AppText>
            </View>
          ))}
        </View>
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#FAFDF9',
  },
  popularCard: {
    borderColor: palette.green100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  finalPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  features: {
    gap: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    flex: 1,
    color: colors.text,
  },
});
