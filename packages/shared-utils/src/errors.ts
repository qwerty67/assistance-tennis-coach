import i18next from 'i18next';

export class ApiError extends Error {
  code: string;
  status?: number;
  details?: unknown;
  constructor(code: string, message?: string, status?: number, details?: unknown) {
    super(message || code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const key = `errors.${e.code}`;
    return (i18next.exists?.(key) ? i18next.t(key) : e.message) || 'خطایی رخ داد';
  }
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as any).message);
  }
  return 'خطای نامشخص رخ داده است';
}
