import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Sheet } from './Sheet';
import { colors, radius, spacing } from '@/shared/theme';
import { digits } from '@/shared/utils/format';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06..23 — typical court hours
const MINUTES = [0, 15, 30, 45];
const pad = (n: number) => String(n).padStart(2, '0');

/** Time field ("HH:mm") optimized for fast selection on court. */
export function TimeField({ label, value, onChange, compact }: { label?: string; value?: string; onChange: (v: string) => void; compact?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [h, m] = (value ?? '17:00').split(':').map(Number);
  const [hour, setHour] = useState(h);
  const [minute, setMinute] = useState(m);
  return (
    <View style={{ gap: 6, flex: compact ? 1 : undefined }}>
      {label ? <AppText variant="bodyMedium">{label}</AppText> : null}
      <PressableScale onPress={() => setOpen(true)} style={styles.field}>
        <Icon name="clock-outline" size={18} color={colors.textMuted} />
        <AppText variant="bodyMedium">{value ? digits(value) : '--:--'}</AppText>
      </PressableScale>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label ?? t('common.time')}
        footer={<Button title={`${t('common.confirm')} · ${digits(`${pad(hour)}:${pad(minute)}`)}`} onPress={() => { onChange(`${pad(hour)}:${pad(minute)}`); setOpen(false); }} />}>
        <AppText variant="small" muted>{t('common.hour')}</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {HOURS.map((x) => (
            <PressableScale key={x} onPress={() => setHour(x)} style={[styles.pill, hour === x && styles.on]}>
              <AppText variant="h3" color={hour === x ? colors.textInverse : colors.text}>{digits(pad(x))}</AppText>
            </PressableScale>
          ))}
        </ScrollView>
        <AppText variant="small" muted>{t('common.minute')}</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {MINUTES.map((x) => (
            <PressableScale key={x} onPress={() => setMinute(x)} style={[styles.pill, { flex: 1 }, minute === x && styles.on]}>
              <AppText variant="h3" align="center" color={minute === x ? colors.textInverse : colors.text}>{digits(pad(x))}</AppText>
            </PressableScale>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1.2, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50 },
  pill: { minWidth: 56, height: 48, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.navy, borderColor: colors.navy },
});
