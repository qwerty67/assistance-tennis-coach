import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';
import { colors, radius, shadows, spacing } from '@/shared/theme';

interface Props<T extends string> { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale key={o.value} onPress={() => onChange(o.value)} style={[styles.item, active && styles.active]} scaleTo={0.96}>
            <AppText variant="bodyMedium" color={active ? colors.text : colors.textMuted} align="center">
              {o.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 4, gap: 4 },
  item: { flex: 1, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  active: { backgroundColor: colors.surface, ...shadows.card },
});
