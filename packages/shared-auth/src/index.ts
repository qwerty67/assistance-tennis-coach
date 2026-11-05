/**
 * Central SSO Client for Tennis Platform
 * Provides unified authentication and shared entities access (Coaches, Students, Users)
 */

export interface SharedUser {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  role: 'coach' | 'student' | string;
  coach_id?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: SharedUser;
}

export interface SharedStudent {
  id: string;
  coach_id?: string | null;
  first_name: string;
  last_name: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  level?: string | null;
  created_at?: string | null;
}

export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export interface SSOConfig {
  baseUrl: string; // e.g. 'http://192.168.1.11:8000/api/v1'
  storage?: StorageAdapter;
}

const TOKEN_KEY = '@tennis_platform:access_token';
const REFRESH_KEY = '@tennis_platform:refresh_token';
const USER_KEY = '@tennis_platform:user';

export class CentralSSOClient {
  private baseUrl: string;
  private storage?: StorageAdapter;

  constructor(config: SSOConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.storage = config.storage;
  }

  setStorage(storage: StorageAdapter) {
    this.storage = storage;
  }

  async login(identifier: string, password: string): Promise<AuthTokens> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }

    const data: AuthTokens = await res.json();
    await this.persistSession(data);
    return data;
  }

  async register(payload: {
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
    email?: string;
    role?: string;
  }): Promise<AuthTokens> {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        phone: payload.phone.trim(),
        role: (payload.role || 'coach').toLowerCase(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }

    const data: AuthTokens = await res.json();
    await this.persistSession(data);
    return data;
  }

  async getMe(token?: string): Promise<SharedUser | null> {
    const authToken = token || (await this.getAccessToken());
    if (!authToken) return null;

    const res = await fetch(`${this.baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) return null;
    const user: SharedUser = await res.json();
    if (this.storage) {
      await this.storage.setItem(USER_KEY, JSON.stringify(user));
    }
    return user;
  }

  async getStudents(token?: string): Promise<SharedStudent[]> {
    const authToken = token || (await this.getAccessToken());
    if (!authToken) throw new Error('Unauthenticated');

    const res = await fetch(`${this.baseUrl}/students`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch shared students');
    }

    return await res.json();
  }

  async createStudent(
    student: { name: string; phone?: string; email?: string; notes?: string; level?: string },
    token?: string
  ): Promise<SharedStudent> {
    const authToken = token || (await this.getAccessToken());
    if (!authToken) throw new Error('Unauthenticated');

    const res = await fetch(`${this.baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(student),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create student' }));
      throw new Error(err.detail || 'Failed to create student');
    }

    return await res.json();
  }

  async logout(): Promise<void> {
    if (this.storage) {
      await this.storage.removeItem(TOKEN_KEY);
      await this.storage.removeItem(REFRESH_KEY);
      await this.storage.removeItem(USER_KEY);
    }
  }

  async getAccessToken(): Promise<string | null> {
    return this.storage ? await this.storage.getItem(TOKEN_KEY) : null;
  }

  async getUser(): Promise<SharedUser | null> {
    if (!this.storage) return null;
    const u = await this.storage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  }

  private async persistSession(tokens: AuthTokens) {
    if (this.storage) {
      await this.storage.setItem(TOKEN_KEY, tokens.access_token);
      if (tokens.refresh_token) {
        await this.storage.setItem(REFRESH_KEY, tokens.refresh_token);
      }
      await this.storage.setItem(USER_KEY, JSON.stringify(tokens.user));
    }
  }
}
