import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Badge, Icon, PressableScale } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';
import { digits } from '@/shared/utils/format';
import type { Exercise } from '@/shared/types/api';

const INTENSITY = { low: colors.info, medium: colors.primary, high: colors.warning, max: colors.danger } as const;

export function ExerciseItem({ ex, onToggle, onLongPress }: { ex: Exercise; onToggle?: () => void; onLongPress?: () => void }) {
  const { t } = useTranslation();
  const done = ex.status === 'done';
  const meta = [
    ex.sets ? t('training.setsN', { n: digits(ex.sets) }) : null,
    ex.repetitions ? t('training.repsN', { n: digits(ex.repetitions) }) : null,
    ex.duration_minutes ? `${digits(ex.duration_minutes)} ${t('common.minutes')}` : null,
  ].filter(Boolean).join(' · ');
  return (
    <PressableScale onPress={onToggle} onLongPress={onLongPress} style={[styles.row, done && { opacity: 0.6 }]}>
      <Icon name={done ? 'checkbox-marked-circle' : ex.status === 'in_progress' ? 'progress-clock' : 'checkbox-blank-circle-outline'} size={26}
        color={done ? colors.primary : ex.status === 'in_progress' ? colors.warning : colors.textSubtle} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyMedium" style={done && { textDecorationLine: 'line-through' }}>{ex.title}</AppText>
        {ex.description ? <AppText variant="small" muted numberOfLines={2}>{ex.description}</AppText> : null}
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {ex.skill ? <Badge label={t(`training.skill.${ex.skill}`, { defaultValue: ex.skill })} color={colors.navy} bg={colors.surfaceMuted} /> : null}
          <Badge label={t(`training.intensity.${ex.intensity}`)} color={INTENSITY[ex.intensity]} bg={colors.surfaceMuted} />
          {meta ? <AppText variant="caption" muted>{meta}</AppText> : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', paddingVertical: spacing.md, borderRadius: radius.md },
});
