import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ModernButton, ModernTextInput, AuthHero } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { COLORS, SPACING, RADIUS, fonts, palette, shadows } from '../theme';

export default function LoginScreen({ navigation }: any) {
    const { login } = useAuth();
    const toast = useToast();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        const cleanId = identifier.trim();
        const cleanPass = password.trim();

        if (!cleanId || !cleanPass) {
            toast.error('شماره موبایل / ایمیل و رمز عبور الزامی است');
            return;
        }

        try {
            setLoading(true);
            await login(cleanId, cleanPass);
            toast.success('ورود با موفقیت انجام شد');
        } catch (error: any) {
            console.error('Login error:', error);
            let msg = 'شماره موبایل یا رمز عبور اشتباه است';
            if (error?.response?.data?.detail) {
                const detail = error.response.data.detail;
                msg = Array.isArray(detail) ? detail[0]?.msg : detail;
            } else if (error?.message) {
                msg = 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت را بررسی کنید.';
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (id: string, pass: string) => {
        setIdentifier(id);
        setPassword(pass);
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <AuthHero
                        title="تحلیل هوشمند بازی"
                        subtitle="ورود به سامانه آنالیز و مربیگری تنیس"
                        badgeIcon="brain"
                        badgeLabel="AI COACH"
                    />

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>ورود به حساب</Text>
                            <Text style={styles.cardSubtitle}>
                                شماره موبایل یا ایمیل خود را وارد نمایید
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <ModernTextInput
                                label="شماره موبایل یا ایمیل"
                                value={identifier}
                                onChangeText={setIdentifier}
                                placeholder="09121234567 یا coach@demo.ir"
                                icon="account-outline"
                                autoCapitalize="none"
                                textAlign="left"
                            />

                            <ModernTextInput
                                label="رمز عبور"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                icon="lock-outline"
                                secureTextEntry={!showPassword}
                                textAlign="left"
                                rightIcon={showPassword ? 'eye-off' : 'eye'}
                                onRightIconPress={() => setShowPassword(!showPassword)}
                            />

                            <View style={styles.buttonContainer}>
                                <ModernButton
                                    title="ورود به حساب"
                                    onPress={handleLogin}
                                    variant="navy"
                                    icon="login"
                                    fullWidth
                                    size="lg"
                                    loading={loading}
                                />
                            </View>

                            <View style={styles.registerLink}>
                                <Text style={styles.registerText}>حساب کاربری ندارید؟ </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.registerButton}>ثبت‌نام کنید</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Demo Accounts */}
                            <View style={styles.demoBox}>
                                <View style={styles.demoHeader}>
                                    <MaterialCommunityIcons name="lightning-bolt" size={16} color={palette.amber500} />
                                    <Text style={styles.demoTitle}>ورود سریع تستی (Demo)</Text>
                                </View>
                                <View style={styles.demoButtons}>
                                    <TouchableOpacity
                                        style={styles.demoChip}
                                        onPress={() => fillDemo('coach@demo.ir', 'Demo1234')}
                                    >
                                        <Text style={styles.demoChipText}>مربی (Coach)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.demoChip}
                                        onPress={() => fillDemo('ali@demo.ir', 'Demo1234')}
                                    >
                                        <Text style={styles.demoChipText}>شاگرد (Student)</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: SPACING.xxxl,
    },
    card: {
        marginTop: -SPACING.xxxl,
        marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        gap: SPACING.lg,
        ...shadows.floating,
    },
    cardHeader: {
        gap: 4,
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontSize: 22,
        fontFamily: fonts.bold,
        color: COLORS.text,
        textAlign: 'right',
        width: '100%',
    },
    cardSubtitle: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: COLORS.textSecondary,
        textAlign: 'right',
        width: '100%',
    },
    form: {
        gap: SPACING.sm,
    },
    buttonContainer: {
        marginTop: SPACING.sm,
    },
    registerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.md,
        gap: 4,
    },
    registerText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: COLORS.textSecondary,
    },
    registerButton: {
        fontSize: 13,
        fontFamily: fonts.bold,
        color: palette.green600,
    },
    demoBox: {
        marginTop: SPACING.lg,
        padding: SPACING.md,
        backgroundColor: COLORS.surfaceVariant,
        borderRadius: RADIUS.md,
        gap: SPACING.sm,
    },
    demoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    demoTitle: {
        fontSize: 12,
        fontFamily: fonts.medium,
        color: COLORS.textSecondary,
    },
    demoButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    demoChip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    demoChipText: {
        fontSize: 12,
        fontFamily: fonts.medium,
        color: COLORS.text,
    },
});
