import React from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomHeader, AppCard } from '../components/common';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import {useToast} from "../context/ToastContext";
import {useAuth} from "../context/AuthContext";

interface SettingItemProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    isDestructive?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
                                                     icon,
                                                     label,
                                                     value,
                                                     onPress,
                                                     hasSwitch,
                                                     switchValue,
                                                     onSwitchChange,
                                                     isDestructive,
                                                 }) => {
    const { colors } = useTheme();
    const textColor = isDestructive ? colors.error : colors.text;
    const iconColor = isDestructive ? colors.error : colors.textSecondary;

    return (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={onPress}
            disabled={!onPress && !hasSwitch}
            activeOpacity={0.7}
        >
            <View style={styles.settingLeft}>
                <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
            </View>

            <View style={styles.settingRight}>
                {hasSwitch ? (
                    <Switch
                        value={switchValue}
                        onValueChange={onSwitchChange}
                        color={COLORS.primary}
                    />
                ) : (
                    value && <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>
                )}
                {onPress && !hasSwitch && (
                    <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textTertiary} />
                )}
            </View>
        </TouchableOpacity>
    );
};

export default function SettingsScreen({ navigation }: any) {

    const { colors, isDark, toggleTheme } = useTheme();
    const { logout, user } = useAuth(); // ✅ دریافت logout و user
    const toast = useToast();

    const handleLogout = () => {
        Alert.alert(
            'خروج از حساب',
            'آیا مطمئن هستید که می‌خواهید خارج شوید؟',
            [
                { text: 'انصراف', style: 'cancel' },
                {
                    text: 'خروج',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            toast.success('با موفقیت خارج شدید');
                        } catch (error) {
                            toast.error('خطا در خروج');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <CustomHeader title="Settings" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* پروفایل کاربر */}
                <AppCard style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                            <MaterialCommunityIcons name="account-tie" size={40} color={colors.primary} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: colors.text }]}>
                                {user?.full_name || 'مربی تنیس'}
                            </Text>
                            <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
                                @{user?.username || 'coach'}
                            </Text>
                        </View>
                    </View>
                </AppCard>

                {/* تنظیمات ظاهری */}
                <AppCard style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ظاهر برنامه</Text>
                    <SettingItem
                        icon={isDark ? "weather-night" : "weather-sunny"}
                        label="حالت تاریک (Dark Mode)"
                        hasSwitch
                        switchValue={isDark}
                        onSwitchChange={toggleTheme}
                    />
                </AppCard>

                {/* تنظیمات عمومی */}
                <AppCard style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>عمومی</Text>
                    <SettingItem
                        icon="information"
                        label="درباره اپلیکیشن"
                        value="نسخه 1.0.0"
                        onPress={() => {}}
                    />
                    <SettingItem
                        icon="help-circle"
                        label="راهنما و پشتیبانی"
                        onPress={() => {}}
                    />
                </AppCard>

                {/* ✅ بخش حساب کاربری با دکمه خروج */}
                <AppCard style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>حساب کاربری</Text>
                    <SettingItem
                        icon="logout"
                        label="خروج از حساب"
                        isDestructive
                        onPress={handleLogout}
                    />
                </AppCard>

                {/* بخش خطرناک */}
                {/*<AppCard style={styles.sectionCard}>*/}
                {/*    <SettingItem*/}
                {/*        icon="delete-forever"*/}
                {/*        label="پاک کردن تمام داده‌ها"*/}
                {/*        isDestructive*/}
                {/*        onPress={() => {*/}
                {/*            Alert.alert('هشدار', 'این عمل قابل بازگشت نیست!');*/}
                {/*        }}*/}
                {/*    />*/}
                {/*</AppCard>*/}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },

    profileCard: {
        marginBottom: SPACING.lg,
        padding: SPACING.xl,
    },
    profileHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
        alignItems: 'flex-start',
        marginRight: SPACING.lg,
    },
    profileName: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    profileRole: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        marginTop: 4,
    },

    sectionCard: {
        marginBottom: SPACING.lg,
        padding: 0, // حذف پدینگ کارت برای لیست آیتم‌ها
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    settingItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        flex: 1,
    },
    settingLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        marginRight: SPACING.md,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        marginLeft: SPACING.sm,
    },
});