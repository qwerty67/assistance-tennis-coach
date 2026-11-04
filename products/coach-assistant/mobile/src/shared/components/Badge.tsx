import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { radius, spacing } from '@/shared/theme';

export function Badge({ label, color, bg, dot }: { label: string; color: string; bg: string; dot?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <AppText variant="caption" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
