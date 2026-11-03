/** Design tokens aligned with Coach Assistant Platform */
export const platformPalette = {
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

export const lightColors = {
  // Primary - Court Green & Navy
  primary: platformPalette.green500,
  primaryLight: platformPalette.green100,
  primaryDark: platformPalette.green600,

  // Secondary - Electric Blue
  secondary: platformPalette.blue500,
  secondaryLight: platformPalette.blue100,
  secondaryDark: '#1E40AF',

  // Accent - Tennis Lime & Amber
  accent: platformPalette.lime400,
  accentLight: platformPalette.lime100,
  accentDark: '#84CC16',

  // Status
  success: platformPalette.green500,
  successLight: platformPalette.green100,
  warning: platformPalette.amber500,
  warningLight: platformPalette.amber100,
  error: platformPalette.red500,
  errorLight: platformPalette.red100,
  info: platformPalette.blue500,
  infoLight: platformPalette.blue100,

  // Background & Surface
  background: platformPalette.offWhite,
  surface: platformPalette.white,
  surfaceVariant: platformPalette.gray100,

  // Text
  text: platformPalette.navy800,
  textSecondary: platformPalette.gray500,
  textTertiary: platformPalette.gray400,
  textInverse: platformPalette.white,

  // Border & Divider
  border: platformPalette.gray200,
  divider: platformPalette.gray100,

  // Other
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(7, 20, 40, 0.5)',
};

export const darkColors = {
  primary: '#10B981',
  primaryLight: '#064E3B',
  primaryDark: '#34D399',

  secondary: '#60A5FA',
  secondaryLight: '#1E3A8A',
  secondaryDark: '#93C5FD',

  accent: platformPalette.lime400,
  accentLight: '#3F6212',
  accentDark: '#BEF264',

  success: '#10B981',
  successLight: '#064E3B',
  warning: platformPalette.amber500,
  warningLight: '#78350F',
  error: platformPalette.red500,
  errorLight: '#7F1D1D',
  info: '#60A5FA',
  infoLight: '#1E3A8A',

  background: platformPalette.navy900,
  surface: platformPalette.navy800,
  surfaceVariant: platformPalette.navy700,

  text: '#F2F4F7',
  textSecondary: platformPalette.gray400,
  textTertiary: platformPalette.gray500,
  textInverse: platformPalette.navy900,

  border: platformPalette.navy600,
  divider: platformPalette.navy700,

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export type Colors = typeof lightColors;
