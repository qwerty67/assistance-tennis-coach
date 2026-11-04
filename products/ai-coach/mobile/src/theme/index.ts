import { lightColors, darkColors, Colors, palette } from './colors';

export { lightColors, darkColors, Colors, palette };

// Spacing tokens (Unified with coach-assistant)
export const SPACING = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
};

export const spacing = SPACING;

// Font tokens
export const fonts = {
    regular: 'Vazirmatn_400Regular',
    medium: 'Vazirmatn_500Medium',
    bold: 'Vazirmatn_700Bold',
    black: 'Vazirmatn_800ExtraBold',
} as const;

// Typography tokens
export const TYPOGRAPHY = {
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        huge: 32,
    },
    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
    display: { fontFamily: fonts.black, fontSize: 28, lineHeight: 40 },
    h1: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 34 },
    h2: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 28 },
    h3: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 24 },
    body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22 },
    bodyMedium: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 22 },
    small: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
    caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16 },
    number: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28 },
};

export const typography = TYPOGRAPHY;

// Radius tokens (Unified with coach-assistant)
export const RADIUS = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    pill: 9999,
};

export const radius = RADIUS;

// Shadow tokens
export const SHADOWS = {
    light: {
        sm: {
            shadowColor: '#0B1F3A',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
        },
        md: {
            shadowColor: '#0B1F3A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
        },
        lg: {
            shadowColor: '#0B1F3A',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 18,
            elevation: 8,
        },
    },
    dark: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 1,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 3,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 5,
        },
    },
};

export const shadows = {
    card: SHADOWS.light.md,
    floating: SHADOWS.light.lg,
};

export const COLORS = lightColors;
export const colors = lightColors;

export const theme = {
    colors: lightColors,
    spacing: SPACING,
    radius: RADIUS,
    fonts,
    typography: TYPOGRAPHY,
    shadows,
};
export type Theme = typeof theme;
