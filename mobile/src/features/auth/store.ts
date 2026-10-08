import { create } from 'zustand';
import { authApi, RegisterPayload } from './api';
import { configureAuth } from '@/shared/services/apiClient';
import { secureStorage } from '@/shared/services/storage';
import { queryClient } from '@/shared/services/queryClient';
import type { TokenPair, User } from '@/shared/types/api';

const K = { access: 'auth_access', refresh: 'auth_refresh', user: 'auth_user' };

interface AuthState {
  status: 'loading' | 'authenticated' | 'guest';
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<User>;
  register: (p: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
}

async function persist(t: TokenPair) {
  await Promise.all([
    secureStorage.set(K.access, t.access_token),
    secureStorage.set(K.refresh, t.refresh_token),
    secureStorage.set(K.user, JSON.stringify(t.user)),
  ]);
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  refreshToken: null,

  hydrate: async () => {
    const [access, refresh, user] = await Promise.all([secureStorage.get(K.access), secureStorage.get(K.refresh), secureStorage.get(K.user)]);
    if (access && refresh && user) {
      set({ accessToken: access, refreshToken: refresh, user: JSON.parse(user), status: 'authenticated' });
    } else set({ status: 'guest' });
  },

  login: async (identifier, password) => {
    const t = await authApi.login(identifier, password);
    await persist(t);
    set({ accessToken: t.access_token, refreshToken: t.refresh_token, user: t.user, status: 'authenticated' });
    return t.user;
  },

  register: async (p) => {
    const t = await authApi.register(p);
    await persist(t);
    set({ accessToken: t.access_token, refreshToken: t.refresh_token, user: t.user, status: 'authenticated' });
    return t.user;
  },

  logout: async () => {
    const rt = get().refreshToken;
    if (rt) authApi.logout(rt).catch(() => {});
    await Promise.all(Object.values(K).map((k) => secureStorage.remove(k)));
    queryClient.clear();
    set({ accessToken: null, refreshToken: null, user: null, status: 'guest' });
  },

  refresh: async () => {
    const rt = get().refreshToken;
    if (!rt) return null;
    try {
      const t = await authApi.refresh(rt);
      await persist(t);
      set({ accessToken: t.access_token, refreshToken: t.refresh_token, user: t.user });
      return t.access_token;
    } catch {
      return null;
    }
  },
}));

// Wire the HTTP client to the auth store (token injection + silent refresh).
configureAuth({
  getAccessToken: () => useAuth.getState().accessToken,
  refresh: () => useAuth.getState().refresh(),
  onAuthFailure: () => {
    useAuth.getState().logout();
  },
});
