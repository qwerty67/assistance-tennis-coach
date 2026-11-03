import React, {useState} from 'react';
import {View, StyleSheet, KeyboardAvoidingView, Platform, Image, Alert} from 'react-native';
import {Text} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {ModernButton, ModernTextInput} from '../components/common';
import {useAuth} from '../context/AuthContext';
import {useToast} from '../context/ToastContext';
import {COLORS, SPACING, TYPOGRAPHY, RADIUS} from '../theme';
import {authService} from '../services/authService';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useNavigation} from "@react-navigation/native";


export default function LoginScreen({navigation}) {
    const {login} = useAuth();
    const toast = useToast();
    const navigate = useNavigation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        console.log("🟢 [1] شروع فرآیند لاگین...");
        console.log("🟢 [2] Username:", username.trim(), "| Password length:", password.trim().length);

        if (!username.trim() || !password.trim()) {
            // toast.error('نام کاربری و رمز عبور الزامی است.');
            console.log('خطا: فیلدها خالی هستند');
            return;
        }

        try {
            setLoading(true);

            // ✅ فراخوانی تابع login از AuthContext
            // این تابع خودش authService را صدا می‌زند و سپس setUser را آپدیت می‌کند
            await login(username.trim(), password);

            // toast.success('ورود با موفقیت انجام شد.');
            console.log('✅ ورود موفقیت‌آمیز بود. تغییر صفحه به صورت خودکار انجام می‌شود.');

            // ❌ هیچ کد navigation.navigate اینجا نیاز نیست!

        } catch (error: any) {
            console.error('🔴 خطا در لاگین:', error);

            let errorMessage = 'خطا در برقراری ارتباط با سرور';
            if (error?.response?.data?.detail) {
                const detail = error.response.data.detail;
                errorMessage = Array.isArray(detail) ? detail[0]?.msg : detail;
            } else if (error?.message) {
                errorMessage = 'لطفاً اتصال اینترنت خود را بررسی کنید.';
            }

            // toast.error(errorMessage);
            console.log('❌ پیام خطا:', errorMessage);
        } finally {
            setLoading(false);
        }

        // try {
        //     setLoading(true);
        //     await login(username.trim(), password);
        //     toast.success('The login was successful.');
        // } catch (error: any) {
        //     // ✅ استخراج هوشمند پیام خطا
        //     let errorMessage = 'خطا در ورود به سیستم';
        //     const detail = error?.response?.data?.detail;
        //
        //     if (Array.isArray(detail)) {
        //         // اگر خطا از نوع Validation Pydantic بود (آرایه‌ای از آبجکت‌ها)
        //         errorMessage = detail[0]?.msg || 'خطای اعتبارسنجی داده‌ها';
        //     } else if (typeof detail === 'string') {
        //         // اگر خطا یک رشته ساده بود (مثل نام کاربری اشتباه)
        //         errorMessage = detail;
        //     }
        //
        //     toast.error(errorMessage);
        // } finally {
        //     setLoading(false);
        // }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.content}>
                    {/* لوگو و عنوان */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/TP-logo-app.png')} // ✅ مسیر لوگوی شما
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        {/*<Text style={styles.title}>TennisPilot</Text>*/}
                        <Text style={styles.subtitle}>Coach Login</Text>
                    </View>

                    {/* فرم */}
                    <View style={styles.form}>
                        <ModernTextInput
                            label="username"
                            value={username}
                            onChangeText={setUsername}
                            placeholder="coach"
                            icon="account"
                            autoCapitalize="none"
                            textAlign="right"
                        />

                        <ModernTextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            icon="lock"
                            secureTextEntry={!showPassword}
                            textAlign="right"
                            rightIcon={showPassword ? 'eye-off' : 'eye'}
                            onRightIconPress={() => setShowPassword(!showPassword)}
                        />

                        <View style={styles.buttonContainer}>
                            <ModernButton
                                title="Login"
                                onPress={handleLogin}
                                variant="primary"
                                icon="login"
                                fullWidth
                                size="lg"
                                loading={loading}
                            />
                        </View>
                    </View>
                    <View style={styles.registerLink}>
                        <Text style={styles.registerText}>Don't have an account? </Text>
                        <Text
                            style={styles.registerButton}
                            onPress={() => navigation.navigate('Register')}
                        >
                            Create Account
                        </Text>
                    </View>
                    {/* اطلاعات تست */}
                    {/*<View style={styles.testInfo}>*/}
                    {/*    <Text style={styles.testTitle}>اطلاعات ورود تست:</Text>*/}
                    {/*    <Text style={styles.testText}>نام کاربری: coach</Text>*/}
                    {/*    <Text style={styles.testText}>رمز عبور: coach123</Text>*/}
                    {/*</View>*/}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        // marginBottom: SPACING.xxxl,
    },
    logoContainer: {
        width: 250,
        height: 250,
        // borderRadius: 75,
        // backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        // marginBottom: SPACING.lg,
        // padding: 20, // فاصله داخلی برای لوگو
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.huge,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        color: COLORS.textSecondary,
    },
    form: {
        gap: SPACING.md,
    },
    buttonContainer: {
        marginTop: SPACING.lg,
    },
    testInfo: {
        marginTop: SPACING.xxl,
        padding: SPACING.lg,
        backgroundColor: COLORS.surfaceVariant,
        borderRadius: RADIUS.lg,
        borderRightWidth: 4,
        borderRightColor: COLORS.primary,
    },
    testTitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    testText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    registerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.xl,
    },
    registerText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    registerButton: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
});