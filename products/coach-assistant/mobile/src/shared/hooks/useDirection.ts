import { I18nManager } from 'react-native';
import i18n from '@/shared/i18n';

/**
 * RTL strategy:
 *  - Release / dev builds: RTL is forced natively (app.json expo-localization plugin + I18nManager.forceRTL).
 *  - Expo Go & web (where native RTL may be unavailable): we fall back to `direction: 'rtl'` on the
 *    root view and explicit right text alignment.
 */
export function getDirection() {
  const appRTL = i18n.dir?.() === 'rtl' || (i18n.language ?? 'fa').startsWith('fa');
  const nativeRTL = I18nManager.isRTL;
  return {
    isRTL: appRTL,
    /** we need to emulate RTL in JS (native layout is LTR) */
    manual: appRTL && !nativeRTL,
    textAlign: (appRTL && !nativeRTL ? 'right' : 'left') as 'right' | 'left',
    /** flip directional icons (chevrons/arrows) */
    flip: appRTL,
  };
}

export const useDirection = getDirection;
