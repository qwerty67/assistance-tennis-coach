import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, IconName } from './Icon';
import { colors, radius, spacing } from '@/shared/theme';
import { errorMessage } from '@/shared/utils/errors';

export function EmptyState({ icon = 'tennis-ball', title, description, actionLabel, onAction }: {
  icon?: IconName; title: string; description?: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={30} color={colors.primary} />
      </View>
      <AppText variant="h3" align="center">{title}</AppText>
      {description ? <AppText variant="body" muted align="center">{description}</AppText> : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} size="sm" icon="plus" style={{ marginTop: spacing.sm }} /> : null}
    </View>
  );
}

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.dangerSoft }]}>
        <Icon name="wifi-off" size={28} color={colors.danger} />
      </View>
      <AppText variant="h3" align="center">{errorMessage(error)}</AppText>
      {onRetry ? <Button title={t('common.retry')} variant="outline" size="sm" icon="refresh" onPress={onRetry} /> : null}
    </View>
  );
}

/** Shimmering placeholder block. */
export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: ViewStyle }) {
  const o = useSharedValue(0.45);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ height, width, borderRadius: radius.sm, backgroundColor: colors.border }, anim, style]} />;
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.skCard}>
          <Skeleton height={14} width="45%" />
          <Skeleton height={12} width="80%" />
          <Skeleton height={12} width="60%" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  skCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
});
