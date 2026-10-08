import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { colors, radius, shadows, spacing } from '@/shared/theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'default' | 'navy' | 'muted' | 'warning';
  /** stagger index for entrance animation */
  index?: number;
  animated?: boolean;
}

export function Card({ children, onPress, style, padded = true, tone = 'default', index = 0, animated = true }: Props) {
  const bg = tone === 'navy' ? colors.navy : tone === 'muted' ? colors.surfaceMuted : tone === 'warning' ? colors.warningSoft : colors.surface;
  const content = (
    <View style={[styles.card, { backgroundColor: bg }, padded && styles.padded, tone === 'default' && shadows.card, style]}>{children}</View>
  );
  const wrapped = onPress ? (
    <PressableScale onPress={onPress} scaleTo={0.985}>
      {content}
    </PressableScale>
  ) : (
    content
  );
  if (!animated) return wrapped;
  return <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(320)}>{wrapped}</Animated.View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  padded: { padding: spacing.lg },
});
