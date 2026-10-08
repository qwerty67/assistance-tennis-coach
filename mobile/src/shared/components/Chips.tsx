import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';
import { Icon, IconName } from './Icon';
import { colors, radius, spacing } from '@/shared/theme';

export interface ChipOption<T extends string | number> { value: T; label: string; icon?: IconName; color?: string }

interface Props<T extends string | number> {
  options: ChipOption<T>[];
  value: T | T[] | null | undefined;
  onChange: (v: T) => void;
  scroll?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

/** Single / multi select chips (multi when `value` is an array). */
export function Chips<T extends string | number>({ options, value, onChange, scroll, label, size = 'md' }: Props<T>) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  const chips = options.map((o) => {
    const active = selected(o.value);
    const tint = o.color ?? colors.navy;
    return (
      <PressableScale
        key={String(o.value)}
        onPress={() => onChange(o.value)}
        style={[
          styles.chip,
          size === 'sm' && styles.sm,
          { backgroundColor: active ? tint : colors.surface, borderColor: active ? tint : colors.border },
        ]}
      >
        {o.icon ? <Icon name={o.icon} size={16} color={active ? colors.textInverse : colors.textMuted} /> : null}
        {o.color && !active ? <View style={[styles.dot, { backgroundColor: o.color }]} /> : null}
        <AppText variant={size === 'sm' ? 'small' : 'bodyMedium'} color={active ? colors.textInverse : colors.text}>
          {o.label}
        </AppText>
      </PressableScale>
    );
  });
  return (
    <View style={{ gap: 6 }}>
      {label ? <AppText variant="bodyMedium">{label}</AppText> : null}
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {chips}
        </ScrollView>
      ) : (
        <View style={[styles.row, { flexWrap: 'wrap' }]}>{chips}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, height: 38, borderRadius: radius.pill, borderWidth: 1 },
  sm: { height: 32, paddingHorizontal: spacing.sm + 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
