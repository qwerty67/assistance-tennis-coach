/**
 * Design tokens - Tennis Platform Unified Palette
 * Navy + Court Green + Tennis Lime + AI Violet accent
 */
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

export const lightColors = {
    // Primary (Court Green)
    primary: palette.green500,
    primaryLight: palette.green100,
    primaryDark: palette.green600,

    // Secondary (Navy)
    secondary: palette.navy800,
    secondaryLight: palette.navy600,
    secondaryDark: palette.navy900,

    // Accent (Lime / Tennis Ball)
    accent: palette.lime400,
    accentLight: palette.lime100,
    accentDark: '#A3D236',

    // AI Accent (Deep Violet - special for AI Coach)
    aiAccent: palette.violet500,
    aiAccentLight: palette.violet100,

    // Status
    success: palette.green500,
    successLight: palette.green100,
    warning: palette.amber500,
    warningLight: palette.amber100,
    error: palette.red500,
    errorLight: palette.red100,
    info: palette.blue500,
    infoLight: palette.blue100,

    // Background & Surface
    background: palette.offWhite,
    surface: palette.white,
    surfaceVariant: palette.gray100,

    // Text
    text: palette.navy800,
    textSecondary: palette.gray500,
    textTertiary: palette.gray400,
    textInverse: palette.white,

    // Border & Divider
    border: palette.gray200,
    divider: palette.gray100,

    // Other
    white: palette.white,
    black: palette.navy900,
    navy: palette.navy800,
    overlay: 'rgba(7, 20, 40, 0.45)',
};

export const darkColors = {
    // Primary
    primary: '#1ED780',
    primaryLight: '#07331F',
    primaryDark: '#0FA968',

    // Secondary
    secondary: '#38BDF8',
    secondaryLight: '#0C4A6E',
    secondaryDark: '#0284C7',

    // Accent
    accent: palette.lime400,
    accentLight: '#2F3C16',
    accentDark: '#E2F795',

    // AI Accent
    aiAccent: '#9B7DFF',
    aiAccentLight: '#261B4E',

    // Status
    success: '#1ED780',
    successLight: '#07331F',
    warning: '#FBBF24',
    warningLight: '#451A03',
    error: '#F87171',
    errorLight: '#450A0A',
    info: '#60A5FA',
    infoLight: '#172554',

    // Background & Surface
    background: '#071428',
    surface: '#0B1F3A',
    surfaceVariant: '#13294B',

    // Text
    text: '#F2F4F7',
    textSecondary: '#98A2B3',
    textTertiary: '#667085',
    textInverse: '#071428',

    // Border & Divider
    border: '#1E3A64',
    divider: '#13294B',

    // Other
    white: palette.white,
    black: '#000000',
    navy: palette.navy800,
    overlay: 'rgba(0, 0, 0, 0.75)',
};

export type Colors = typeof lightColors;
