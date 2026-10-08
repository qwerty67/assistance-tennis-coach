import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { colors, spacing } from '@/shared/theme';

interface Props {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  chevron?: boolean;
  divider?: boolean;
}

export function ListRow({ title, subtitle, left, right, icon, onPress, chevron = !!onPress, divider }: Props) {
  return (
    <PressableScale onPress={onPress} disabled={!onPress} scaleTo={0.99} style={[styles.row, divider && styles.divider]}>
      {left ?? (icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={20} color={colors.navy} />
        </View>
      ) : null)}
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium" numberOfLines={1}>{title}</AppText>
        {subtitle ? <AppText variant="small" muted numberOfLines={2}>{subtitle}</AppText> : null}
      </View>
      {right}
      {chevron ? <Icon name="chevron-left" size={20} color={colors.textSubtle} /> : null}
    </PressableScale>
  );
}

export function KeyValue({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <View style={styles.kv}>
      <AppText variant="body" muted>{label}</AppText>
      <AppText variant={strong ? 'h3' : 'bodyMedium'} color={color}>{value}</AppText>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm }} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
});
