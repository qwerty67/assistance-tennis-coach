import { colors } from './colors';

export * from './colors';

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const fonts = {
  regular: 'Vazirmatn_400Regular',
  medium: 'Vazirmatn_500Medium',
  bold: 'Vazirmatn_700Bold',
  black: 'Vazirmatn_800ExtraBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.black, fontSize: 28, lineHeight: 40 },
  h1: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 34 },
  h2: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 28 },
  h3: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16 },
  number: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

export const theme = { colors, spacing, radius, fonts, typography, shadows };
export type Theme = typeof theme;
