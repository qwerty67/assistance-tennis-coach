import { ScrollView, StyleSheet, View } from 'react-native';
import dayjs from 'dayjs';
import { AppText, PressableScale } from '@/shared/components';
import { classTypeColors, colors, radius, spacing } from '@/shared/theme';
import { digits, formatTime } from '@/shared/utils/format';
import type { Session } from '@/shared/types/api';

const HOUR = 56;
const FROM = 6;
const TO = 24;

/** Hour grid with positioned session blocks (day view). */
export function DayTimeline({ sessions, onPress }: { sessions: Session[]; onPress: (s: Session) => void }) {
  const hours = Array.from({ length: TO - FROM }, (_, i) => FROM + i);
  const now = dayjs();
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ height: hours.length * HOUR + spacing.xl }} contentOffset={{ x: 0, y: Math.max(0, (now.hour() - FROM - 1) * HOUR) }}>
      {hours.map((h) => (
        <View key={h} style={[styles.hour, { top: (h - FROM) * HOUR }]}>
          <AppText variant="caption" muted style={styles.label}>{digits(`${String(h).padStart(2, '0')}:00`)}</AppText>
          <View style={styles.line} />
        </View>
      ))}
      {sessions.map((s) => {
        const st = dayjs(s.start_at);
        const top = (st.hour() + st.minute() / 60 - FROM) * HOUR;
        const height = Math.max(28, (dayjs(s.end_at).diff(st, 'minute') / 60) * HOUR - 4);
        const c = classTypeColors[s.class_type];
        return (
          <PressableScale key={s.id} onPress={() => onPress(s)} style={[styles.block, { top, height, backgroundColor: c.soft, borderColor: c.main, opacity: s.status === 'cancelled' ? 0.5 : 1 }]}>
            <AppText variant="small" color={c.main} numberOfLines={1} style={{ fontFamily: 'Vazirmatn_700Bold' }}>{s.class_name}</AppText>
            {height > 40 ? <AppText variant="caption" numberOfLines={1}>{`${formatTime(s.start_at)} – ${formatTime(s.end_at)} · ${s.student_names.join('، ')}`}</AppText> : null}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hour: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', height: HOUR },
  label: { width: 52, textAlign: 'center', marginTop: -7 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  block: { position: 'absolute', start: 56, end: spacing.md, borderRadius: radius.sm, borderStartWidth: 3, paddingHorizontal: spacing.sm, paddingVertical: 4, overflow: 'hidden' },
});
