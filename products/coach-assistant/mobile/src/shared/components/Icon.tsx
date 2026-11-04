import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { getDirection } from '@/shared/hooks/useDirection';
import { colors } from '@/shared/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const DIRECTIONAL = new Set<string>(['chevron-left', 'chevron-right', 'arrow-left', 'arrow-right', 'arrow-top-right']);

export function Icon({ name, size = 22, color = colors.text, style }: { name: IconName; size?: number; color?: string; style?: object }) {
  const flip = getDirection().flip && DIRECTIONAL.has(name as string);
  return <MaterialCommunityIcons name={name} size={size} color={color} style={[flip ? { transform: [{ scaleX: -1 }] } : null, style]} />;
}
