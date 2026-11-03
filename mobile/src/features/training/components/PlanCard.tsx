import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Card, ProgressBar } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { digits, formatDate } from '@/shared/utils/format';
import type { TrainingPlan } from '@/shared/types/api';

export function PlanCard({ plan, onPress, index, showStudent }: { plan: TrainingPlan; onPress?: () => void; index?: number; showStudent?: boolean }) {
  const { t } = useTranslation();
  const done = plan.exercises.filter((e) => e.status === 'done').length;
  return (
    <Card onPress={onPress} index={index} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>{plan.title}</AppText>
        <AppText variant="small" color={colors.primaryDark}>{digits(Math.round(plan.progress * 100))}٪</AppText>
      </View>
      <AppText variant="small" muted>
        {[showStudent ? plan.student_name : null, t(`training.planStatus.${plan.status}`), t('training.exercisesN', { d: digits(done), n: digits(plan.exercises.length) }), plan.end_date ? t('training.until', { d: formatDate(plan.end_date) }) : null].filter(Boolean).join(' · ')}
      </AppText>
      <ProgressBar value={plan.progress} />
    </Card>
  );
}
