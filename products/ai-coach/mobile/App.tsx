import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator, { AuthStack } from './src/navigation/AppNavigator';
import { ToastProvider } from './src/context/ToastContext';
import { ToastContainer } from './src/components/common';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import {
    useFonts,
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_700Bold,
    Vazirmatn_800ExtraBold,
} from '@expo-google-fonts/vazirmatn';

function AppContent() {
    const { colors, isDark } = useTheme();
    const { isAuthenticated, loading } = useAuth();
    const [fontsLoaded] = useFonts({
        Vazirmatn_400Regular,
        Vazirmatn_500Medium,
        Vazirmatn_700Bold,
        Vazirmatn_800ExtraBold,
    });

    if (loading || !fontsLoaded) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#071428' : '#F6F7F4',
                }}
            >
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <NavigationContainer>
                    <ToastProvider>
                        {isAuthenticated ? <AppNavigator /> : <AuthStack />}
                        <ToastContainer />
                    </ToastProvider>
                </NavigationContainer>
            </View>
        </>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <PaperProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <ErrorBoundary>
                            <AppContent />
                        </ErrorBoundary>
                    </AuthProvider>
                </ThemeProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
