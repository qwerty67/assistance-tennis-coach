import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ModernButton, ModernTextInput, AuthHero } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { COLORS, SPACING, RADIUS, fonts, palette, shadows } from '../theme';

export default function RegisterScreen({ navigation }: any) {
    const { register } = useAuth();
    const toast = useToast();

    const [role, setRole] = useState<'COACH' | 'STUDENT'>('COACH');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            toast.error('نام و نام خانوادگی الزامی است');
            return;
        }
        if (!phone.trim() || phone.trim().length < 10) {
            toast.error('شماره موبایل معتبر (حداقل ۱۰ رقم) الزامی است');
            return;
        }
        if (!password || password.length < 6) {
            toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد');
            return;
        }

        try {
            setLoading(true);
            await register({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone: phone.trim(),
                email: email.trim() || undefined,
                password,
                role,
            });
            toast.success('ثبت‌نام با موفقیت انجام شد');
            // Auto-logged in by context, or goBack
        } catch (error: any) {
            console.error('Register error:', error);
            let msg = 'خطا در ثبت‌نام کاربر';
            if (error?.response?.data?.detail) {
                const detail = error.response.data.detail;
                msg = Array.isArray(detail) ? detail[0]?.msg : detail;
            } else if (error?.message) {
                msg = error.message;
            }
            toast.error(msg);
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
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <AuthHero
                        title="ثبت‌نام در پلتفرم"
                        subtitle="حساب کاربری مرکزی تنیس برای تمام محصولات"
                        badgeIcon="account-plus"
                        badgeLabel="PLATFORM"
                    />

                    <View style={styles.card}>
                        {/* Role Selector Chips */}
                        <View style={styles.roleContainer}>
                            <Text style={styles.fieldLabel}>نقش شما در پلتفرم:</Text>
                            <View style={styles.roleChipsRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.roleChip,
                                        role === 'COACH' && styles.roleChipActive,
                                    ]}
                                    onPress={() => setRole('COACH')}
                                >
                                    <MaterialCommunityIcons
                                        name="whistle-outline"
                                        size={18}
                                        color={role === 'COACH' ? '#FFFFFF' : COLORS.textSecondary}
                                    />
                                    <Text
                                        style={[
                                            styles.roleChipText,
                                            role === 'COACH' && styles.roleChipTextActive,
                                        ]}
                                    >
                                        مربی (Coach)
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.roleChip,
                                        role === 'STUDENT' && styles.roleChipActive,
                                    ]}
                                    onPress={() => setRole('STUDENT')}
                                >
                                    <MaterialCommunityIcons
                                        name="account-school-outline"
                                        size={18}
                                        color={role === 'STUDENT' ? '#FFFFFF' : COLORS.textSecondary}
                                    />
                                    <Text
                                        style={[
                                            styles.roleChipText,
                                            role === 'STUDENT' && styles.roleChipTextActive,
                                        ]}
                                    >
                                        شاگرد / بازیکن
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Name fields row */}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <ModernTextInput
                                    label="نام خانوادگی"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="مثال: رضایی"
                                    textAlign="right"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <ModernTextInput
                                    label="نام"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="مثال: علی"
                                    textAlign="right"
                                />
                            </View>
                        </View>

                        <ModernTextInput
                            label="شماره موبایل"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="09121234567"
                            icon="phone-outline"
                            keyboardType="phone-pad"
                            textAlign="left"
                        />

                        <ModernTextInput
                            label="ایمیل (اختیاری)"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="coach@example.com"
                            icon="email-outline"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            textAlign="left"
                        />

                        <ModernTextInput
                            label="رمز عبور"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="حداقل ۶ کاراکتر"
                            icon="lock-outline"
                            secureTextEntry
                            textAlign="left"
                            hint="ترکیب حروف و اعداد برای امنیت بیشتر"
                        />

                        <View style={styles.buttonContainer}>
                            <ModernButton
                                title="ایجاد حساب کاربری"
                                onPress={handleRegister}
                                variant="navy"
                                icon="account-check"
                                fullWidth
                                size="lg"
                                loading={loading}
                            />
                        </View>

                        <View style={styles.loginLink}>
                            <Text style={styles.loginText}>قبلاً حساب کاربری ساخته‌اید؟ </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.loginButton}>وارد شوید</Text>
                            </TouchableOpacity>
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
        paddingBottom: 60,
    },
    card: {
        marginTop: -SPACING.xxxl,
        marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        gap: SPACING.md,
        ...shadows.floating,
    },
    roleContainer: {
        gap: 6,
    },
    fieldLabel: {
        fontSize: 13,
        fontFamily: fonts.medium,
        color: COLORS.text,
        textAlign: 'right',
    },
    roleChipsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    roleChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        backgroundColor: COLORS.surfaceVariant,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    roleChipActive: {
        backgroundColor: palette.navy800,
        borderColor: palette.navy800,
    },
    roleChipText: {
        fontSize: 13,
        fontFamily: fonts.medium,
        color: COLORS.textSecondary,
    },
    roleChipTextActive: {
        color: '#FFFFFF',
        fontFamily: fonts.bold,
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    buttonContainer: {
        marginTop: SPACING.sm,
    },
    loginLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.sm,
        gap: 4,
    },
    loginText: {
        fontSize: 13,
        fontFamily: fonts.regular,
        color: COLORS.textSecondary,
    },
    loginButton: {
        fontSize: 13,
        fontFamily: fonts.bold,
        color: palette.green600,
    },
});
