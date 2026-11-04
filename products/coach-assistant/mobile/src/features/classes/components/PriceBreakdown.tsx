import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';
import { formatMoney } from '@/shared/utils/format';

/** Visual split of a session price into court cost & coach income (used in finance reports). */
export function PriceBreakdown({ price, court }: { price: number; court: number }) {
  const { t } = useTranslation();
  const coach = Math.max(0, price - court);
  const ratio = price ? court / price : 0;
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.bar}>
        <View style={{ flex: Math.max(ratio, 0.001), backgroundColor: colors.warning }} />
        <View style={{ flex: Math.max(1 - ratio, 0.001), backgroundColor: colors.primary }} />
      </View>
      <View style={styles.legend}>
        <Legend color={colors.warning} label={t('classes.courtCost')} value={formatMoney(court)} />
        <Legend color={colors.primary} label={t('classes.coachIncome')} value={formatMoney(coach)} />
      </View>
    </View>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <AppText variant="small" muted>{label}</AppText>
      <AppText variant="small">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
});
