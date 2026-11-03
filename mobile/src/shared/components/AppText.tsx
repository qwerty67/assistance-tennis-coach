import { Text, TextProps, TextStyle } from 'react-native';
import { colors, typography } from '@/shared/theme';
import { getDirection } from '@/shared/hooks/useDirection';

export type TextVariant = keyof typeof typography;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'auto' | 'center' | 'start' | 'end';
  muted?: boolean;
}

/** Base text component: Persian font, RTL aware alignment, design-system variants. */
export function AppText({ variant = 'body', color, align = 'auto', muted, style, ...rest }: AppTextProps) {
  const dir = getDirection();
  let textAlign: TextStyle['textAlign'];
  if (align === 'center') textAlign = 'center';
  else if (align === 'end') textAlign = dir.manual ? 'left' : 'right';
  else textAlign = dir.manual ? 'right' : undefined;
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: color ?? (muted ? colors.textMuted : colors.text), writingDirection: dir.isRTL ? 'rtl' : 'ltr' },
        textAlign ? { textAlign } : null,
        style,
      ]}
    />
  );
}
