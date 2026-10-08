import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import { useSessions } from '@/features/sessions/api';
import { SessionCard } from '@/features/sessions/components/SessionCard';
import { DayTimeline } from '../components/DayTimeline';
import { AppText, Card, EmptyState, Fab, Header, IconButton, MonthGrid, PressableScale, Screen, SegmentedControl } from '@/shared/components';
import { classTypeColors, colors, radius, spacing } from '@/shared/theme';
import { d, digits, formatDate } from '@/shared/utils/format';
import { jalaliMonthGrid, sameDay, startOfPersianWeek, toISODate } from '@/shared/utils/dates';

type View_ = 'day' | 'week' | 'month';

/** Day / week / month calendar (Jalali, week starts Saturday) with colour per class type. */
export function CalendarScreen({ role = 'coach' }: { role?: 'coach' | 'student' }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<View_>('week');
  const [anchor, setAnchor] = useState<Dayjs>(dayjs());
  const [selected, setSelected] = useState(toISODate(dayjs()));

  const range = useMemo(() => {
    if (mode === 'day') return [anchor.startOf('day'), anchor.endOf('day')];
    if (mode === 'week') { const s = startOfPersianWeek(anchor); return [s, s.add(6, 'day').endOf('day')]; }
    const grid = jalaliMonthGrid(anchor);
    return [grid[0], grid[grid.length - 1].endOf('day')];
  }, [mode, anchor]);

  const { data = [] } = useSessions({ date_from: range[0].toISOString(), date_to: range[1].toISOString() });
  const base = role === 'coach' ? '/coach' : '/student';
  const open = (id: string) => router.push(`${base}/session/${id}`);

  const markers = useMemo(() => {
    const m = new Map<string, string[]>();
    data.forEach((s) => {
      const k = toISODate(dayjs(s.start_at));
      m.set(k, [...(m.get(k) ?? []), classTypeColors[s.class_type].main]);
    });
    return m;
  }, [data]);

  const shift = (dir: 1 | -1) => {
    const unit = mode === 'day' ? 'day' : mode === 'week' ? 'week' : 'month';
    const next = mode === 'month' ? d(anchor).add(dir, 'month') : anchor.add(dir, unit);
    setAnchor(dayjs(next.toDate()));
    if (mode === 'day') setSelected(toISODate(next));
  };

  const title = mode === 'month' ? digits(d(anchor).format('MMMM YYYY')) : mode === 'week'
    ? `${formatDate(range[0].toDate(), 'D MMM')} – ${formatDate(range[1].toDate(), 'D MMM')}` : formatDate(anchor.toDate(), 'dddd D MMMM');
  const weekdays = t('calendar.weekdaysShort', { returnObjects: true }) as string[];
  const daySessions = data.filter((s) => sameDay(s.start_at, selected));

  return (
    <Screen scroll={false} padded={false} header={<Header large title={t('nav.calendar')} right={<IconButton icon="calendar-today" onPress={() => { setAnchor(dayjs()); setSelected(toISODate(dayjs())); }} />} />}>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <SegmentedControl<View_> value={mode} onChange={setMode} options={[
          { value: 'day', label: t('calendar.day') }, { value: 'week', label: t('calendar.week') }, { value: 'month', label: t('calendar.month') },
        ]} />
        <View style={styles.nav}>
          <IconButton icon="chevron-right" size={36} onPress={() => shift(-1)} />
          <AppText variant="h3">{title}</AppText>
          <IconButton icon="chevron-left" size={36} onPress={() => shift(1)} />
        </View>
      </View>

      {mode === 'day' ? (
        <DayTimeline sessions={data} onPress={(s) => open(s.id)} />
      ) : mode === 'week' ? (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }} refreshControl={undefined}>
          <View style={styles.weekStrip}>
            {Array.from({ length: 7 }, (_, i) => range[0].add(i, 'day')).map((day, i) => {
              const iso = toISODate(day);
              const on = iso === selected;
              const dots = markers.get(iso) ?? [];
              return (
                <PressableScale key={iso} onPress={() => setSelected(iso)} style={[styles.dayCell, on && { backgroundColor: colors.navy }, sameDay(day, dayjs()) && !on && { borderColor: colors.primary, borderWidth: 1.5 }]}>
                  <AppText variant="caption" color={on ? 'rgba(255,255,255,0.7)' : colors.textMuted}>{weekdays[i]}</AppText>
                  <AppText variant="h3" color={on ? colors.textInverse : colors.text}>{digits(d(day).date())}</AppText>
                  <View style={{ flexDirection: 'row', gap: 2, height: 6 }}>
                    {dots.slice(0, 3).map((c, j) => <View key={j} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c }} />)}
                  </View>
                </PressableScale>
              );
            })}
          </View>
          {dayList()}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }}>
          <Card>
            <MonthGrid grid={jalaliMonthGrid(anchor)} month={d(anchor).month()} weekdays={weekdays} selected={selected} markers={markers} onSelect={(day) => setSelected(toISODate(day))} />
          </Card>
          <Legend />
          <AppText variant="h3">{formatDate(selected, 'dddd D MMMM')}</AppText>
          {dayList()}
        </ScrollView>
      )}
      {role === 'coach' ? <Fab icon="calendar-plus" onPress={() => router.push(`/coach/session/form?date=${selected}`)} /> : null}
    </Screen>
  );

  function dayList() {
    if (!daySessions.length) return <EmptyState icon="calendar-blank-outline" title={t('calendar.empty')} />;
    return daySessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} onPress={() => open(s.id)} />);
  }
}

function Legend() {
  const { t } = useTranslation();
  return (
    <View style={styles.legend}>
      {(['private', 'semi_private', 'group', 'academy'] as const).map((k) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: classTypeColors[k].main }} />
          <AppText variant="caption" muted>{t(`classes.type.${k}`)}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekStrip: { flexDirection: 'row', gap: 4 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
});
