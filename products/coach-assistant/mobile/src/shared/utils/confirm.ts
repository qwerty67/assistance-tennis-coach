import { Alert, Platform } from 'react-native';
import i18n from '@/shared/i18n';

/** Cross-platform confirmation dialog. */
export function confirm(title: string, message?: string, destructive = false): Promise<boolean> {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: i18n.t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: i18n.t('common.confirm'), style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]),
  );
}
