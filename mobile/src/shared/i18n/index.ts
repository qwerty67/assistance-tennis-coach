import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import 'dayjs/locale/fa';
import fa from './locales/fa';
import en from './locales/en';

export const LANGUAGES = { fa: { dir: 'rtl' }, en: { dir: 'ltr' } } as const;
export type Lang = keyof typeof LANGUAGES;

i18n.use(initReactI18next).init({
  resources: { fa: { translation: fa }, en: { translation: en } },
  lng: 'fa', // Persian first – English ready for the future
  fallbackLng: 'fa',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
