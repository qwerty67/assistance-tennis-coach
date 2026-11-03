import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { Button, IconButton } from './Button';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Sheet } from './Sheet';
import { colors, radius, spacing } from '@/shared/theme';
import { d, digits, formatDate } from '@/shared/utils/format';
import { jalaliMonthGrid, toISODate } from '@/shared/utils/dates';

interface Props { label?: string; value?: string | null; onChange: (iso: string) => void; error?: string; placeholder?: string }

/** Jalali (Shamsi) date picker. Value is ISO yyyy-mm-dd (Gregorian) for the API. */
export function DateField({ label, value, onChange, error, placeholder }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <AppText variant="bodyMedium">{label}</AppText> : null}
      <PressableScale onPress={() => setOpen(true)} style={[styles.field, error && { borderColor: colors.danger }]}>
        <Icon name="calendar-month-outline" size={20} color={colors.textMuted} />
        <AppText variant="body" color={value ? colors.text : colors.textSubtle} style={{ flex: 1 }}>
          {value ? formatDate(value, 'dddd D MMMM YYYY') : placeholder ?? t('common.selectDate')}
        </AppText>
      </PressableScale>
      {error ? <AppText variant="small" color={colors.danger}>{error}</AppText> : null}
      <DatePickerSheet visible={open} value={value} onClose={() => setOpen(false)} onSelect={(v) => { onChange(v); setOpen(false); }} />
    </View>
  );
}

export function DatePickerSheet({ visible, value, onClose, onSelect, markers }: {
  visible: boolean; value?: string | null; onClose: () => void; onSelect: (iso: string) => void; markers?: Set<string>;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState(() => dayjs(value ?? undefined));
  const grid = useMemo(() => jalaliMonthGrid(anchor), [anchor]);
  const month = d(anchor).month();
  const weekdays = t('calendar.weekdaysShort', { returnObjects: true }) as string[];
  return (
    <Sheet visible={visible} onClose={onClose} title={digits(d(anchor).format('MMMM YYYY'))}
      footer={<Button title={t('common.today')} variant="outline" onPress={() => onSelect(toISODate(dayjs()))} />}>
      <MonthGrid grid={grid} month={month} weekdays={weekdays} selected={value ?? undefined} markers={markers}
        onPrev={() => setAnchor(d(anchor).subtract(1, 'month'))} onNext={() => setAnchor(d(anchor).add(1, 'month'))}
        onSelect={(day) => onSelect(toISODate(day))} />
    </Sheet>
  );
}

export function MonthGrid({ grid, month, weekdays, selected, onSelect, onPrev, onNext, markers }: {
  grid: dayjs.Dayjs[]; month: number; weekdays: string[]; selected?: string; onSelect: (d: dayjs.Dayjs) => void;
  onPrev?: () => void; onNext?: () => void; markers?: Set<string> | Map<string, string[]>;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {onPrev ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <IconButton icon="chevron-right" onPress={onPrev} size={36} />
          <IconButton icon="chevron-left" onPress={onNext} size={36} />
        </View>
      ) : null}
      <View style={styles.week}>
        {weekdays.map((w) => (
          <AppText key={w} variant="caption" muted align="center" style={styles.cell}>{w}</AppText>
        ))}
      </View>
      {Array.from({ length: 6 }).map((_, r) => (
        <View key={r} style={styles.week}>
          {grid.slice(r * 7, r * 7 + 7).map((day) => {
            const iso = toISODate(day);
            const inMonth = d(day).month() === month;
            const isSel = selected === iso;
            const isToday = day.isSame(dayjs(), 'day');
            const m = markers instanceof Map ? markers.get(iso) : markers?.has(iso) ? [colors.primary] : undefined;
            return (
              <PressableScale key={iso} onPress={() => onSelect(day)} style={[styles.cell, styles.day, isSel && styles.sel, !isSel && isToday && styles.today]} scaleTo={0.9}>
                <AppText variant="bodyMedium" align="center" color={isSel ? colors.textInverse : inMonth ? colors.text : colors.textSubtle}>
                  {digits(d(day).date())}
                </AppText>
                <View style={styles.dots}>
                  {(m ?? []).slice(0, 3).map((c, i) => <View key={i} style={[styles.dot, { backgroundColor: isSel ? colors.accent : c }]} />)}
                </View>
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1.2, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50 },
  week: { flexDirection: 'row' },
  cell: { flex: 1 },
  day: { height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, margin: 2 },
  sel: { backgroundColor: colors.navy },
  today: { borderWidth: 1.5, borderColor: colors.primary },
  dots: { flexDirection: 'row', gap: 2, height: 5, marginTop: 1 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});
