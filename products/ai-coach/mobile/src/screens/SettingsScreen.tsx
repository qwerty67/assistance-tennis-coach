import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
    AppText,
    Avatar,
    Badge,
    Card,
    Header,
    ListRow,
    Screen,
    SectionHeader,
} from '@tennis-platform/design-system';
import { colors, palette, spacing } from '@tennis-platform/design-system';
import { digits } from '@tennis-platform/shared-utils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function SettingsScreen({ navigation }: any) {
    const { colors: themeColors, isDark, toggleTheme } = useTheme();
    const { logout, user } = useAuth();
    const toast = useToast();

    const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.full_name || 'مربی تنیس';
    const roleLabel = user?.role === 'STUDENT' ? 'شاگرد / بازیکن' : 'مربی تنیس (Coach)';

    const handleLogout = () => {
        Alert.alert(
            'خروج از حساب',
            'آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟',
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
                            toast.error('خطا در خروج از حساب');
                        }
                    },
                },
            ]
        );
    };

    return (
        <Screen
            header={
                <Header
                    title="پروفایل و تنظیمات"
                    back={navigation.canGoBack()}
                    onBack={() => navigation.goBack()}
                />
            }
        >
            {/* User Profile Card */}
            <Card style={styles.profileCard}>
                <Avatar name={name} size={64} />
                <View style={styles.profileInfo}>
                    <AppText variant="h2">{name}</AppText>
                    <View style={styles.badgeRow}>
                        <Badge
                            label={roleLabel}
                            color={palette.green600}
                            bg={palette.green100}
                        />
                    </View>
                    {user?.phone ? (
                        <AppText variant="small" muted>
                            {`شماره همراه: ${digits(user.phone)}`}
                        </AppText>
                    ) : null}
                    {user?.email ? (
                        <AppText variant="small" muted>
                            {user.email}
                        </AppText>
                    ) : null}
                </View>
            </Card>

            {/* Platform & AI Settings */}
            <SectionHeader title="پلتفرم و هوش مصنوعی" />
            <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
                <ListRow
                    icon="robot-outline"
                    title="دستیار هوشمند تنیس (AI Pilot)"
                    subtitle="فعال با مدل‌های تحلیلی پلتفرم"
                    divider
                />
                <ListRow
                    icon="database-sync-outline"
                    title="پایگاه داده یکپارچه"
                    subtitle="همگام با سرویس مرکزی تنیس"
                    divider
                />
                <ListRow
                    icon={isDark ? 'weather-night' : 'weather-sunny'}
                    title="حالت تیره (Dark Mode)"
                    subtitle={isDark ? 'فعال' : 'غیرفعال'}
                    onPress={toggleTheme}
                />
            </Card>

            {/* General Info */}
            <SectionHeader title="اطلاعات و پشتیبانی" />
            <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
                <ListRow
                    icon="help-circle-outline"
                    title="راهنمای ثبت ضربات و سیستم امتیازدهی"
                    divider
                />
                <ListRow
                    icon="information-outline"
                    title="درباره پلتفرم تنیس"
                    subtitle="نسخه ۱.۰.۰"
                    divider
                />
                <ListRow
                    icon="logout"
                    title="خروج از حساب کاربری"
                    onPress={handleLogout}
                />
            </Card>

            <AppText variant="caption" muted align="center" style={{ marginTop: spacing.md }}>
                Tennis Platform · AI Coach Assistant v1.0.0
            </AppText>
        </Screen>
    );
}

const styles = StyleSheet.create({
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    profileInfo: {
        flex: 1,
        gap: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        marginVertical: 2,
    },
});
