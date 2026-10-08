import { StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { colors, radius, shadows, spacing } from '@/shared/theme';

export function Fab({ icon = 'plus', label, onPress }: { icon?: IconName; label?: string; onPress: () => void }) {
  return (
    <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.wrap}>
      <PressableScale onPress={onPress} style={[styles.fab, shadows.floating]} scaleTo={0.92}>
        <Icon name={icon} size={24} color={colors.navy} />
        {label ? <AppText variant="bodyMedium" color={colors.navy} style={{ fontFamily: 'Vazirmatn_700Bold' }}>{label}</AppText> : null}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: spacing.xl, end: spacing.lg },
  fab: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 56, minWidth: 56, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.accent, justifyContent: 'center' },
});
