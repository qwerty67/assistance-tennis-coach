import { Alert, Platform } from 'react-native';
import i18next from 'i18next';

/** Cross-platform confirmation dialog. */
export function confirm(title: string, message?: string, destructive = false): Promise<boolean> {
  const cancelText = (i18next.exists?.('common.cancel') ? i18next.t('common.cancel') : null) || 'انصراف';
  const confirmText = (i18next.exists?.('common.confirm') ? i18next.t('common.confirm') : null) || 'تأیید';

  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]),
  );
}
