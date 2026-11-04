import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, SHADOWS, SPACING, TYPOGRAPHY, RADIUS, Colors } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    colors: Colors;
    shadows: typeof SHADOWS.light;
    spacing: typeof SPACING;
    typography: typeof TYPOGRAPHY;
    radius: typeof RADIUS;
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [isLoaded, setIsLoaded] = useState(false);

    // بارگذاری تم ذخیره شده
    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
                setModeState(savedMode);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const setMode = async (newMode: ThemeMode) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
            setModeState(newMode);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const toggleTheme = () => {
        const newMode = isDark ? 'light' : 'dark';
        setMode(newMode);
    };

    // تعیین حالت تاریک بر اساس mode و system
    const isDark =
        mode === 'system'
            ? systemColorScheme === 'dark'
            : mode === 'dark';

    const colors = isDark ? darkColors : lightColors;
    const shadows = isDark ? SHADOWS.dark : SHADOWS.light;

    const value: ThemeContextType = {
        mode,
        isDark,
        colors,
        shadows,
        spacing: SPACING,
        typography: TYPOGRAPHY,
        radius: RADIUS,
        setMode,
        toggleTheme,
    };

    if (!isLoaded) {
        return null; // یا یک LoadingScreen
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};