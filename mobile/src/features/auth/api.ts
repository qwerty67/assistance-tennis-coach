import { api } from '@/shared/services/apiClient';
import type { Role, TokenPair, User } from '@/shared/types/api';

export interface RegisterPayload { first_name: string; last_name: string; email: string; phone: string; password: string; role: Role }

export const authApi = {
  login: (identifier: string, password: string) => api.post<TokenPair>('/auth/login', { identifier, password }),
  register: (p: RegisterPayload) => api.post<TokenPair>('/auth/register', p),
  refresh: (refresh_token: string) => api.post<TokenPair>('/auth/refresh', { refresh_token }),
  logout: (refresh_token: string) => api.post('/auth/logout', { refresh_token }),
  me: () => api.get<User>('/auth/me'),
};
