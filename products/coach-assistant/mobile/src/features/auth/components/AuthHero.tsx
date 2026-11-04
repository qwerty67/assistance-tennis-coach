import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Icon } from '@/shared/components';
import { colors, palette, spacing } from '@/shared/theme';

/** Navy hero with court lines – the only place we use a gradient (brand moment). */
export function AuthHero({ title, subtitle }: { title: string; subtitle: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[palette.navy900, palette.navy700]} style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}>
      <View style={styles.court} pointerEvents="none">
        <View style={styles.lineH} />
        <View style={styles.lineV} />
        <View style={[styles.lineH, { top: '78%' }]} />
      </View>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.logo}>
        <Icon name="tennis-ball" size={34} color={colors.navy} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <AppText variant="display" color={colors.textInverse}>{title}</AppText>
        <AppText variant="body" color="rgba(255,255,255,0.72)">{subtitle}</AppText>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl + spacing.xl, gap: spacing.lg, overflow: 'hidden' },
  logo: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  court: { ...StyleSheet.absoluteFill, opacity: 0.12 },
  lineH: { position: 'absolute', top: '40%', left: -20, right: -20, height: 2, backgroundColor: '#fff' },
  lineV: { position: 'absolute', top: 0, bottom: 0, left: '62%', width: 2, backgroundColor: '#fff' },
});
