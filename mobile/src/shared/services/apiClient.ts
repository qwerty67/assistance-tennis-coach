import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getServerUrl } from './config';

export interface ApiErrorShape { code: string; message: string; details?: unknown; status?: number }

export class ApiError extends Error implements ApiErrorShape {
  code: string;
  details?: unknown;
  status?: number;
  constructor(e: ApiErrorShape) {
    super(e.message);
    this.code = e.code;
    this.details = e.details;
    this.status = e.status;
  }
  get isNetwork() {
    return this.code === 'network_error';
  }
}

type TokenProvider = {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
  onAuthFailure: () => void;
};

let tokens: TokenProvider = { getAccessToken: () => null, refresh: async () => null, onAuthFailure: () => {} };
export const configureAuth = (p: TokenProvider) => {
  tokens = p;
};

export const http = axios.create({ timeout: 15000, headers: { 'Content-Type': 'application/json' } });

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getServerUrl();
  const token = tokens.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ error?: ApiErrorShape }>) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing = refreshing ?? tokens.refresh().finally(() => (refreshing = null));
      const newToken = await refreshing;
      if (newToken) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${newToken}` };
        return http(original);
      }
      tokens.onAuthFailure();
    }
    if (!error.response) {
      throw new ApiError({ code: 'network_error', message: error.message });
    }
    const body = error.response.data?.error;
    throw new ApiError({
      code: body?.code ?? 'unknown_error',
      message: body?.message ?? error.message,
      details: body?.details,
      status,
    });
  },
);

/** Small typed helpers used by feature api modules. */
export const api = {
  get: <T>(url: string, params?: object) => http.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, body?: unknown) => http.post<T>(url, body).then((r) => r.data),
  put: <T>(url: string, body?: unknown) => http.put<T>(url, body).then((r) => r.data),
  patch: <T>(url: string, body?: unknown) => http.patch<T>(url, body).then((r) => r.data),
  delete: <T = void>(url: string) => http.delete<T>(url).then((r) => r.data),
};
