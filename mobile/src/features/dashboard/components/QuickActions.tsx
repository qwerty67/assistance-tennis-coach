import { StyleSheet, View } from 'react-native';
import { AppText, Icon, IconName, PressableScale } from '@/shared/components';
import { colors, radius, spacing } from '@/shared/theme';

export interface QuickAction { icon: IconName; label: string; onPress: () => void; tint?: string; soft?: string }

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <PressableScale key={a.label} onPress={a.onPress} style={styles.item} scaleTo={0.92}>
          <View style={[styles.icon, { backgroundColor: a.soft ?? colors.surface }]}>
            <Icon name={a.icon} size={22} color={a.tint ?? colors.navy} />
          </View>
          <AppText variant="caption" align="center" numberOfLines={1}>{a.label}</AppText>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  item: { flex: 1, alignItems: 'center', gap: 6 },
  icon: { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
