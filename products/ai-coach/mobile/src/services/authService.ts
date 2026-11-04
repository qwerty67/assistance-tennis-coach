import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const AUTH_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    phone?: string;
    email?: string;
    role?: string;
    // Backward compatibility
    username?: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    user: User;
}

export interface RegisterPayload {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    password: string;
    role?: 'coach' | 'student' | 'COACH' | 'STUDENT';
}

const authApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export const authService = {
    login: async (identifier: string, password: string): Promise<LoginResponse> => {
        const cleanIdentifier = identifier.trim();
        const response = await authApi.post('/auth/login', {
            identifier: cleanIdentifier,
            username: cleanIdentifier,
            password,
        });
        const data: LoginResponse = response.data;

        // Ensure backward-compatible full_name and username
        if (!data.user.full_name) {
            data.user.full_name = `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim();
        }
        if (!data.user.username) {
            data.user.username = data.user.phone || data.user.email || cleanIdentifier;
        }

        await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
        if (data.refresh_token) {
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
        }
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

        return data;
    },

    register: async (payload: RegisterPayload | { fullName?: string; username?: string; password: string }): Promise<LoginResponse> => {
        let registerBody: any;
        if ('first_name' in payload) {
            registerBody = {
                first_name: payload.first_name.trim(),
                last_name: payload.last_name.trim(),
                phone: payload.phone.trim(),
                email: payload.email?.trim() || undefined,
                password: payload.password,
                role: (payload.role || 'COACH').toUpperCase(),
            };
        } else {
            // Backward compatibility
            const parts = (payload.fullName || '').trim().split(' ');
            const firstName = parts[0] || 'User';
            const lastName = parts.slice(1).join(' ') || 'Coach';
            registerBody = {
                first_name: firstName,
                last_name: lastName,
                phone: payload.username || '09120000000',
                password: payload.password,
                role: 'COACH',
            };
        }

        const response = await authApi.post('/auth/register', registerBody);
        const data: LoginResponse = response.data;

        if (data.access_token) {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
            if (data.refresh_token) {
                await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
            }
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }

        return data;
    },

    logout: async () => {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
    },

    getToken: async (): Promise<string | null> => {
        return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    },

    getUser: async (): Promise<User | null> => {
        const userStr = await AsyncStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    getMe: async (): Promise<User | null> => {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return null;
        try {
            const resp = await authApi.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const u = resp.data;
            if (!u.full_name) {
                u.full_name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            }
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
            return u;
        } catch {
            return null;
        }
    },

    isAuthenticated: async (): Promise<boolean> => {
        const token = await authService.getToken();
        if (!token) return false;

        try {
            const { jwtDecode } = await import('jwt-decode');
            const decoded: any = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch {
            return true;
        }
    },
};

export default authService;
