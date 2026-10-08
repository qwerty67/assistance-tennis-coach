import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Card, ClassTypeBadge, Icon } from '@/shared/components';
import { classTypeColors, colors, spacing } from '@/shared/theme';
import { digits, formatMoney } from '@/shared/utils/format';
import type { TennisClass } from '@/shared/types/api';

export function ClassCard({ item, onPress, index }: { item: TennisClass; onPress?: () => void; index?: number }) {
  const { t } = useTranslation();
  const c = classTypeColors[item.class_type];
  const price = item.class_type === 'group' && item.monthly_fee ? `${formatMoney(item.monthly_fee)} / ${t('common.month')}` : `${formatMoney(item.session_price)} / ${t('common.session')}`;
  return (
    <Card onPress={onPress} index={index} style={!item.is_active && { opacity: 0.55 }}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: c.soft }]}>
          <Icon name={item.class_type === 'academy' ? 'school-outline' : item.class_type === 'group' ? 'account-group' : item.class_type === 'semi_private' ? 'account-multiple' : 'account'} size={22} color={c.main} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyMedium" numberOfLines={1}>{item.name}</AppText>
          <AppText variant="small" muted>{`${digits(item.duration_minutes)} ${t('common.minutes')} · ${t('classes.membersN', { n: digits(item.member_count), max: digits(item.capacity_max) })}`}</AppText>
        </View>
        <ClassTypeBadge type={item.class_type} />
      </View>
      <View style={styles.price}>
        <AppText variant="h3">{price}</AppText>
        {item.court_cost ? <AppText variant="caption" muted>{t('classes.breakdownShort', { court: formatMoney(item.court_cost), coach: formatMoney(item.coach_income) })}</AppText> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  price: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: 2 },
});
