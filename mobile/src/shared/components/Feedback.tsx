import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, ZoomIn, FadeIn, FadeOut, useSharedValue, withSequence, withTiming, useAnimatedStyle, withDelay } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { colors, radius, shadows, spacing } from '@/shared/theme';

/** Global toast (mounted once in the root layout). */
export function ToastHost() {
  const { toast, clear } = useFeedback();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 2600);
    return () => clearTimeout(t);
  }, [toast, clear]);
  if (!toast) return null;
  const tone = toast.kind === 'error' ? colors.danger : toast.kind === 'success' ? colors.primary : colors.info;
  return (
    <Animated.View key={toast.id} entering={FadeInUp.springify()} exiting={FadeOutUp} style={[styles.toast, { top: insets.top + spacing.sm }]} pointerEvents="none">
      <Icon name={toast.kind === 'error' ? 'alert-circle' : 'check-circle'} color={tone} size={22} />
      <AppText variant="bodyMedium" style={{ flex: 1 }}>{toast.message}</AppText>
    </Animated.View>
  );
}

/** Full screen success animation (payment success, attendance registered). */
export function CelebrateHost() {
  const { celebrate, clearCelebrate } = useFeedback();
  const ring = useSharedValue(0);
  useEffect(() => {
    if (!celebrate) return;
    ring.value = 0;
    ring.value = withSequence(withTiming(1, { duration: 450 }), withDelay(600, withTiming(0, { duration: 200 })));
    const t = setTimeout(clearCelebrate, 1400);
    return () => clearTimeout(t);
  }, [celebrate, clearCelebrate, ring]);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.6 + ring.value * 0.8 }], opacity: 1 - ring.value * 0.7 }));
  if (!celebrate) return null;
  return (
    <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(200)} style={styles.overlay} pointerEvents="none">
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.check}>
          <Icon name="check-bold" size={44} color={colors.navy} />
        </Animated.View>
      </View>
      <Animated.View entering={FadeInUp.delay(150)}>
        <AppText variant="h2" color={colors.textInverse} align="center">{celebrate.message}</AppText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadows.floating, zIndex: 1000,
  },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(7,20,40,0.78)', alignItems: 'center', justifyContent: 'center', gap: spacing.xl, zIndex: 999 },
  check: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: colors.accent },
});
