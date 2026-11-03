import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';
import { Icon } from './Icon';
import { colors, spacing } from '@/shared/theme';

export function SectionHeader({ title, action, onAction, count }: { title: string; action?: string; onAction?: () => void; count?: number }) {
  return (
    <View style={styles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
        <AppText variant="h3">{title}</AppText>
        {count !== undefined ? (
          <View style={styles.count}>
            <AppText variant="caption" color={colors.textMuted}>{count}</AppText>
          </View>
        ) : null}
      </View>
      {action ? (
        <PressableScale onPress={onAction} style={styles.action}>
          <AppText variant="small" color={colors.primaryDark}>{action}</AppText>
          <Icon name="chevron-left" size={16} color={colors.primaryDark} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: -spacing.xs },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  count: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 7, minWidth: 22, alignItems: 'center' },
});
