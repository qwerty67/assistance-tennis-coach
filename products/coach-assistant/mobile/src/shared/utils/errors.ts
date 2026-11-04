import i18n from '@/shared/i18n';
import { ApiError } from '@/shared/services/apiClient';

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const key = `errors.${e.code}`;
    return i18n.exists(key) ? i18n.t(key) : e.message || i18n.t('errors.unknown_error');
  }
  return i18n.t('errors.unknown_error');
}
