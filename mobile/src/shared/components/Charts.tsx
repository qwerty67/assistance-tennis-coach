import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/shared/theme';
import { formatMoneyShort } from '@/shared/utils/format';

export interface BarDatum { label: string; value: number; secondary?: number; highlight?: boolean }

function Bar({ ratio, color, delay, width }: { ratio: number; color: string; delay: number; width: number }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(delay, withTiming(ratio, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [ratio, delay, h]);
  const style = useAnimatedStyle(() => ({ height: `${Math.max(2, h.value * 100)}%` }));
  return <Animated.View style={[{ width, backgroundColor: color, borderRadius: 6 }, style]} />;
}

/** Animated vertical bar chart (optionally two series: e.g. received vs charged). */
export function BarChart({ data, height = 150, color = colors.primary, secondaryColor = colors.border, formatValue = formatMoneyShort }: {
  data: BarDatum[]; height?: number; color?: string; secondaryColor?: string; formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondary ?? 0)));
  const hasSecondary = data.some((d) => d.secondary !== undefined);
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={[styles.bars, { height }]}>
        {data.map((d, i) => (
          <View key={d.label + i} style={styles.col}>
            <AppText variant="caption" muted numberOfLines={1} style={{ fontSize: 9 }}>
              {d.value ? formatValue(d.value) : ''}
            </AppText>
            <View style={[styles.track, { flexDirection: 'row', gap: 3 }]}>
              {hasSecondary ? <Bar ratio={(d.secondary ?? 0) / max} color={secondaryColor} delay={i * 60} width={8} /> : null}
              <Bar ratio={d.value / max} color={d.highlight ? colors.navy : color} delay={i * 60 + 30} width={hasSecondary ? 10 : 18} />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <AppText key={d.label + i} variant="caption" muted align="center" style={{ flex: 1 }} numberOfLines={1}>
            {d.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

/** Horizontal ranked bars (income per student / class). */
export function HBarList({ data, color = colors.primary, formatValue = formatMoneyShort }: { data: BarDatum[]; color?: string; formatValue?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ gap: spacing.md }}>
      {data.map((d, i) => (
        <View key={d.label + i} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="small" numberOfLines={1} style={{ flex: 1 }}>{d.label}</AppText>
            <AppText variant="small" muted>{formatValue(d.value)}</AppText>
          </View>
          <View style={styles.hTrack}>
            <View style={[styles.hFill, { width: `${(d.value / max) * 100}%`, backgroundColor: color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export interface DonutSlice { value: number; color: string; label: string }

export function DonutChart({ data, size = 140, stroke = 18, centerLabel, centerValue }: {
  data: DonutSlice[]; size?: number; stroke?: number; centerLabel?: string; centerValue?: string;
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceMuted} strokeWidth={stroke} fill="none" />
            {data.map((s, i) => {
              const len = (s.value / total) * c;
              const el = (
                <Circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={s.color} strokeWidth={stroke} fill="none"
                  strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap="butt" />
              );
              offset += len;
              return el;
            })}
          </G>
        </Svg>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          {centerValue ? <AppText variant="h3" align="center">{centerValue}</AppText> : null}
          {centerLabel ? <AppText variant="caption" muted align="center">{centerLabel}</AppText> : null}
        </View>
      </View>
      <View style={{ flex: 1, gap: spacing.sm }}>
        {data.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
            <AppText variant="small" style={{ flex: 1 }} numberOfLines={1}>{s.label}</AppText>
            <AppText variant="small" muted>{formatMoneyShort(s.value)}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary, height = 8 }: { value: number; color?: string; height?: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 600 });
  }, [value, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: radius.pill, backgroundColor: color }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  col: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  track: { flex: 1, width: '100%', alignItems: 'flex-end', justifyContent: 'center' },
  labels: { flexDirection: 'row', gap: spacing.xs },
  hTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  hFill: { height: 8, borderRadius: 4 },
});
