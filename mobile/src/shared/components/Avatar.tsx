import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { initials } from '@/shared/utils/format';
import { palette } from '@/shared/theme';

const TONES = [
  [palette.green100, palette.green600],
  [palette.blue100, palette.blue500],
  [palette.amber100, '#B45309'],
  [palette.violet100, palette.violet500],
  [palette.lime100, '#4D7C0F'],
];

export function Avatar({ name, size = 44 }: { name?: string | null; size?: number }) {
  const code = (name ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const [bg, fg] = TONES[code % TONES.length];
  return (
    <View style={[styles.a, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <AppText variant={size > 50 ? 'h2' : 'bodyMedium'} color={fg} align="center">
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({ a: { alignItems: 'center', justifyContent: 'center' } });
