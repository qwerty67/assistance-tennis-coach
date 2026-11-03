import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import {API_BASE_URL} from "../utils/constants";
import axios from "axios"; // ✅ فقط و فقط از همین api استفاده می‌کنیم

const AUTH_TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';

export interface User {
    username: string;
    full_name: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
}

const authApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await authApi.post('/auth/login', { username, password });
        const data = response.data;

        // ✅ اضافه کردن این دو خط برای دیباگ
        console.log("💾 [SAVE DEBUG] در حال ذخیره توکن با کلید: 'access_token'");
        console.log("💾 [SAVE DEBUG] مقدار توکن:", data.access_token.substring(0, 15) + "...");

        // ✅ ذخیره با کلید دقیقاً یکسان
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));

        return data;
    },

    logout: async () => {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
        // ✅ نیازی به دستکاری هدر نیست، اینترسپتور خودش مدیریت می‌کند
    },

    getToken: async (): Promise<string | null> => {
        return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    },

    getUser: async (): Promise<User | null> => {
        const userStr = await AsyncStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: async (): Promise<boolean> => {
        const token = await authService.getToken();
        if (!token) return false;

        try {
            const { jwtDecode } = await import('jwt-decode');
            const decoded: any = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },

    register: async (fullName: string, username: string, password: string): Promise<void> => {
        // ✅ استفاده از api به جای authApi
        await authApi.post('/auth/register', { full_name: fullName, username, password });
    },
};

// ✅ اکسپورت کردن api برای استفاده در سایر سرویس‌ها (مثل studentService)
export default api;