import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { colors, radius, shadows, spacing } from '@/shared/theme';

interface Props {
  label: string;
  value: string;
  icon: IconName;
  tint?: string;
  soft?: string;
  hint?: string;
  onPress?: () => void;
}

export function StatCard({ label, value, icon, tint = colors.primary, soft = colors.primarySoft, hint, onPress }: Props) {
  return (
    <PressableScale onPress={onPress} disabled={!onPress} style={[styles.card, shadows.card]}>
      <View style={[styles.icon, { backgroundColor: soft }]}>
        <Icon name={icon} size={18} color={tint} />
      </View>
      <AppText variant="number" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="small" muted numberOfLines={1}>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" color={tint} numberOfLines={1}>
          {hint}
        </AppText>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, minWidth: 140, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: 2,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
});
