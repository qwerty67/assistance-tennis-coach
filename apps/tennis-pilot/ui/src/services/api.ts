import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🕵️‍♂️ Request interceptor (حالت جاسوسی)
api.interceptors.request.use(async (config) => {
    console.log(`\n🔍 [DEBUG] در حال ارسال درخواست به: ${config.url}`);

    // ⚠️ دقت کنید این کلید باید دقیقاً همان کلیدی باشد که در authService ذخیره می‌کنید
    const token = await AsyncStorage.getItem('access_token');
    console.log("✅ tokentokentokentokentoken:", token);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("✅ [DEBUG] توکن پیدا شد و به هدر اضافه شد:", token.substring(0, 15) + "...");
    } else {
        console.warn("❌ [DEBUG] هیچ توکنی با کلید 'access_token' در حافظه پیدا نشد!");
    }

    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`✅ [DEBUG] پاسخ موفق از: ${response.config.url}`);
        return response;
    },
    async (error: AxiosError) => {
        if (error?.response?.status === 401) {
            console.error(`🔴 [DEBUG] خطای 401 از سرور برای آدرس: ${error.config?.url}`);
            // await AsyncStorage.removeItem('access_token');
            // await AsyncStorage.removeItem('auth_user');
            // اگر تابع ناوبری دارید اینجا صدا بزنید
        }
        return Promise.reject(error);
    }
);

export default api;