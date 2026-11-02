/** Design tokens – Modern / Minimal / Sporty palette (navy + court green + tennis-ball lime). */
export const palette = {
  navy900: '#071428',
  navy800: '#0B1F3A',
  navy700: '#13294B',
  navy600: '#1E3A64',
  green600: '#0A8F5F',
  green500: '#0FA968',
  green100: '#DDF5EA',
  lime400: '#C8F169',
  lime100: '#F2FBDC',
  blue500: '#2F6BFF',
  blue100: '#E3ECFF',
  amber500: '#F59E0B',
  amber100: '#FEF1D6',
  violet500: '#7C5CFF',
  violet100: '#ECE7FF',
  red500: '#E5484D',
  red100: '#FDE6E7',
  gray900: '#101828',
  gray700: '#344054',
  gray500: '#667085',
  gray400: '#98A2B3',
  gray300: '#D0D5DD',
  gray200: '#E6E8EC',
  gray100: '#F2F4F7',
  offWhite: '#F6F7F4',
  white: '#FFFFFF',
} as const;

export const colors = {
  background: palette.offWhite,
  surface: palette.white,
  surfaceMuted: palette.gray100,
  border: palette.gray200,
  text: palette.navy800,
  textMuted: palette.gray500,
  textSubtle: palette.gray400,
  textInverse: palette.white,
  primary: palette.green500,
  primaryDark: palette.green600,
  primarySoft: palette.green100,
  navy: palette.navy800,
  navyDeep: palette.navy900,
  accent: palette.lime400,
  accentSoft: palette.lime100,
  info: palette.blue500,
  infoSoft: palette.blue100,
  warning: palette.amber500,
  warningSoft: palette.amber100,
  danger: palette.red500,
  dangerSoft: palette.red100,
  success: palette.green500,
  successSoft: palette.green100,
  overlay: 'rgba(7,20,40,0.45)',
} as const;

/** Visual distinction for each class type (calendar, cards, chips). */
export const classTypeColors: Record<string, { main: string; soft: string }> = {
  private: { main: palette.green500, soft: palette.green100 },
  semi_private: { main: palette.blue500, soft: palette.blue100 },
  group: { main: palette.amber500, soft: palette.amber100 },
  academy: { main: palette.violet500, soft: palette.violet100 },
};

/** Distinct color palette for tennis classes (coaches can pick or system assigns). */
export const classPalette = [
  '#0FA968', // Court Green
  '#2F6BFF', // Electric Blue
  '#7C5CFF', // Deep Violet
  '#EA580C', // Clay Orange
  '#D946EF', // Vibrant Fuchsia
  '#0891B2', // Cyan/Teal
  '#E5484D', // Sport Red
  '#D97706', // Warm Amber
  '#059669', // Emerald
  '#4F46E5', // Indigo
] as const;

export function getClassColor(classType?: string, customColor?: string | null): { main: string; soft: string } {
  if (customColor) {
    return { main: customColor, soft: `${customColor}25` };
  }
  if (classType && classTypeColors[classType]) {
    return classTypeColors[classType];
  }
  return classTypeColors.private;
}

export const financialStatusColors: Record<string, { main: string; soft: string }> = {
  settled: { main: palette.green500, soft: palette.green100 },
  credit: { main: palette.blue500, soft: palette.blue100 },
  partial: { main: palette.amber500, soft: palette.amber100 },
  debt: { main: palette.red500, soft: palette.red100 },
  overdue: { main: palette.red500, soft: palette.red100 },
  paid: { main: palette.green500, soft: palette.green100 },
  unpaid: { main: palette.gray500, soft: palette.gray100 },
};

export const attendanceColors: Record<string, { main: string; soft: string }> = {
  present: { main: palette.green500, soft: palette.green100 },
  makeup: { main: palette.violet500, soft: palette.violet100 },
  excused: { main: palette.blue500, soft: palette.blue100 },
  unexcused: { main: palette.red500, soft: palette.red100 },
  absent: { main: palette.amber500, soft: palette.amber100 },
  cancelled: { main: palette.gray500, soft: palette.gray100 },
};
