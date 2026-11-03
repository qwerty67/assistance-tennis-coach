import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { colors, radius, spacing } from '@/shared/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'navy' | 'accent' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const V: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: colors.textInverse },
  navy: { bg: colors.navy, fg: colors.textInverse },
  accent: { bg: colors.accent, fg: colors.navy },
  secondary: { bg: colors.primarySoft, fg: colors.primaryDark },
  ghost: { bg: 'transparent', fg: colors.text },
  outline: { bg: colors.surface, fg: colors.text, border: colors.border },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};
const S: Record<Size, { h: number; px: number; font: 'small' | 'bodyMedium' | 'h3' }> = {
  sm: { h: 36, px: spacing.md, font: 'small' },
  md: { h: 48, px: spacing.lg, font: 'bodyMedium' },
  lg: { h: 56, px: spacing.xl, font: 'h3' },
};

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, loading, disabled, fullWidth, style, testID }: Props) {
  const v = V[variant];
  const s = S[size];
  const isDisabled = disabled || loading;
  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={[
        styles.base,
        { backgroundColor: v.bg, height: s.h, paddingHorizontal: s.px, opacity: isDisabled ? 0.55 : 1 },
        v.border ? { borderWidth: 1, borderColor: v.border } : null,
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={v.fg} /> : null}
          <AppText variant={s.font} color={v.fg} style={{ fontFamily: 'Vazirmatn_700Bold' }}>
            {title}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

export function IconButton({ icon, onPress, color = colors.text, bg = colors.surface, size = 40, badge, accessibilityLabel }: {
  icon: IconName; onPress?: () => void; color?: string; bg?: string; size?: number; badge?: number; accessibilityLabel?: string;
}) {
  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.iconBtn, { width: size, height: size, backgroundColor: bg }]}
      scaleTo={0.9}
    >
      <Icon name={icon} size={size * 0.52} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <AppText variant="caption" color={colors.textInverse} style={{ fontSize: 9, lineHeight: 12 }}>
            {badge > 9 ? '9+' : badge}
          </AppText>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 2, end: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
});
