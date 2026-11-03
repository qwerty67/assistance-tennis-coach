import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ModernButton, ModernTextInput } from '../components/common';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';

export default function RegisterScreen({ navigation }: any) {
    const toast = useToast();

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName.trim() || !username.trim() || !password.trim()) {
            toast.error('Please fill in all the fields.');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('The password and its confirmation do not match.');
            return;
        }
        if (password.length < 6) {
            toast.error('The password must be at least 6 characters long.');
            return;
        }

        try {
            setLoading(true);
            await authService.register(fullName.trim(), username.trim(), password);
            toast.success('Registration successful. Log in now.');
            navigation.goBack(); // بازگشت به صفحه لاگین
        } catch (error: any) {
            const message = error?.response?.data?.detail || 'خطا در ثبت‌ نام';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <MaterialCommunityIcons name="account-plus" size={64} color={COLORS.primary} />
                        </View>
                        <Text style={styles.title}>Create an account</Text>
                        <Text style={styles.subtitle}>Enter your information.</Text>
                    </View>

                    <View style={styles.form}>
                        <ModernTextInput
                            label="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="example: علی احمدی"
                            icon="account"
                            textAlign="right"
                        />

                        <ModernTextInput
                            label="username"
                            value={username}
                            onChangeText={setUsername}
                            placeholder="username"
                            icon="at"
                            autoCapitalize="none"
                            textAlign="right"
                        />

                        <ModernTextInput
                            label="password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="At least 6 characters"
                            icon="lock"
                            secureTextEntry
                            textAlign="right"
                        />

                        <ModernTextInput
                            label="Confirm password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm password"
                            icon="lock-check"
                            secureTextEntry
                            textAlign="right"
                        />

                        <View style={styles.buttonContainer}>
                            <ModernButton
                                title="Sign Up"
                                onPress={handleRegister}
                                variant="primary"
                                icon="account-check"
                                fullWidth
                                size="lg"
                                loading={loading}
                            />
                        </View>

                        <View style={styles.loginLink}>
                            <Text style={styles.loginText}>Do you have an account? </Text>
                            <Text
                                style={styles.loginButton}
                                onPress={() => navigation.goBack()}
                            >
                                Log in
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { flexGrow: 1, padding: SPACING.xl, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: SPACING.xxxl },
    logoContainer: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
    },
    title: { fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.text, marginBottom: SPACING.xs },
    subtitle: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary },
    form: { gap: SPACING.xs },
    buttonContainer: { marginTop: SPACING.lg },
    loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
    loginText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary },
    loginButton: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeight.bold },
});