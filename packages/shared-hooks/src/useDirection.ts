import { I18nManager } from 'react-native';
import i18next from 'i18next';

/**
 * RTL strategy:
 *  - Release / dev builds: RTL is forced natively (app.json expo-localization plugin + I18nManager.forceRTL).
 *  - Expo Go & web (where native RTL may be unavailable): we fall back to `direction: 'rtl'` on the
 *    root view and explicit right text alignment.
 */
export function getDirection() {
  const lang = i18next.language ?? 'fa';
  const appRTL = (i18next.dir ? i18next.dir() === 'rtl' : true) || lang.startsWith('fa');
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
