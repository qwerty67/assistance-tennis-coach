import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Avatar, Badge, Card, FinancialBadge } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { formatMoney } from '@/shared/utils/format';
import type { Student } from '@/shared/types/api';

export function StudentCard({ student, onPress, index }: { student: Student; onPress?: () => void; index?: number }) {
  const { t } = useTranslation();
  const acc = student.account;
  return (
    <Card onPress={onPress} index={index} style={student.status === 'inactive' && { opacity: 0.6 }}>
      <View style={styles.row}>
        <Avatar name={`${student.first_name} ${student.last_name}`} />
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="bodyMedium" numberOfLines={1}>{`${student.first_name} ${student.last_name}`}</AppText>
          <View style={styles.badges}>
            <Badge label={t(`students.level.${student.level}`)} color={colors.navy} bg={colors.surfaceMuted} />
            {student.status === 'inactive' ? <Badge label={t('students.status.inactive')} color={colors.textMuted} bg={colors.surfaceMuted} /> : null}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {acc ? <FinancialBadge status={acc.status} /> : null}
          {acc && acc.balance < 0 ? <AppText variant="small" color={colors.danger}>{formatMoney(-acc.balance)}</AppText> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badges: { flexDirection: 'row', gap: 6 },
});
