import React from 'react';
import {Provider as PaperProvider} from 'react-native-paper';
import {StatusBar} from 'expo-status-bar';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator, { AuthStack } from './src/navigation/AppNavigator';
import {ToastProvider} from './src/context/ToastContext';
import {ToastContainer} from './src/components/common';
import LoginScreen from './src/screens/LoginScreen';
import {ActivityIndicator, View} from 'react-native';
import {AuthProvider, useAuth} from "./src/context/AuthContext";
import {NavigationContainer} from "@react-navigation/native";
import {ErrorBoundary} from "./src/components/ErrorBoundary";

function AppContent() {
    const {colors, isDark} = useTheme();
    const {isAuthenticated, loading} = useAuth();
    // return isAuthenticated ? <AppNavigator /> : <LoginScreen />;
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
                <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#2563EB'} />
            </View>
        );
    }
    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'}/>
            <View style={{ flex: 1, backgroundColor: colors.background }}>

            <NavigationContainer>
                <ToastProvider>
                    {isAuthenticated ? <AppNavigator/> : <AuthStack />}
                    <ToastContainer/>
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
                            <AppContent/>
                        </ErrorBoundary>
                    </AuthProvider>
                </ThemeProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
}