import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CustomHeader, AppCard, ModernButton, ConfirmationDialog, SkeletonCard, SkeletonAvatar, SkeletonStatGrid } from '../components/common';
import { StatItem } from '../components/analysis';
import { studentService } from '../services/studentService';
import { matchService } from '../services/matchService';
import { Match } from '../types';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext'; // ✅ اضافه شد
import { SPACING, TYPOGRAPHY, RADIUS } from '../theme';

export default function StudentDetailsScreen({ route, navigation }: any) {
    const { studentId } = route.params;
    const { colors, shadows } = useTheme(); // ✅ دریافت تم
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [student, setStudent] = useState<any>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);

            // ۱. بارگذاری اطلاعات شاگرد با آمار (از اندپوینت /details)
            const studentData = await studentService.getWithStats(studentId);
            setStudent(studentData?.data);

            // ۲. بارگذاری مسابقات شاگرد (برای نمایش تاریخچه)
            // نکته: چون اندپوینت details فقط آمار تجمیعی می‌دهد، برای لیست مسابقات باید جداگانه فچ کنیم
            const matchesData = await matchService.getAll();
            const studentMatches = (matchesData || []).filter((m: Match) => m.student_id === studentId);
            setMatches(studentMatches);

        } catch (error) {
            console.error('Error loading student:', error);
            toast.error('خطا در بارگذاری اطلاعات');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [studentId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleDelete = async () => {
        try {
            await studentService.delete(studentId);
            toast.success('شاگرد با موفقیت حذف شد');
            navigation.goBack();
        } catch (error) {
            console.error('Error deleting student:', error);
            toast.error('خطا در حذف شاگرد');
        }
    };

    const formatPersianDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    if (loading || !student) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <CustomHeader title="پروفایل شاگرد" onBack={() => navigation.goBack()} />
                <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                    <SkeletonAvatar />
                    <SkeletonCard />
                    <SkeletonCard />
                    <View style={[styles.statsCardSkeleton, { backgroundColor: colors.surface }]}>
                        <SkeletonStatGrid />
                    </View>
                </ScrollView>
            </View>
        );
    }

    const stats = student.stats || {};

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <CustomHeader
                title="پروفایل شاگرد"
                onBack={() => navigation.goBack()}
                rightAction={{
                    icon: 'delete',
                    onPress: () => setDeleteDialogVisible(true),
                    color: colors.error,
                }}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* دکمه ویرایش */}
                <View style={styles.editButtonContainer}>
                    <ModernButton
                        title="ویرایش اطلاعات"
                        onPress={() => navigation.navigate('EditStudent', { studentId })}
                        variant="outline"
                        icon="pencil"
                        fullWidth
                    />
                </View>

                {/* بخش ۱: اطلاعات شخصی */}
                <AppCard style={styles.infoCard}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                            <MaterialCommunityIcons name="account" size={48} color={colors.primary} />
                        </View>
                        <Text style={[styles.studentName, { color: colors.text }]}>{student.name}</Text>
                        <Text style={[styles.joinDate, { color: colors.textSecondary }]}>
                            عضویت از {formatPersianDate(student.created_at)}
                        </Text>
                    </View>

                    <View style={styles.infoSection}>
                        {student.phone && (
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="phone" size={20} color={colors.textSecondary} />
                                <Text style={[styles.infoText, { color: colors.text }]}>{student.phone}</Text>
                            </View>
                        )}
                        {student.email && (
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="email" size={20} color={colors.textSecondary} />
                                <Text style={[styles.infoText, { color: colors.text }]}>{student.email}</Text>
                            </View>
                        )}
                        {student.notes && (
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="note-text" size={20} color={colors.textSecondary} />
                                <Text style={[styles.infoText, { color: colors.text }]}>{student.notes}</Text>
                            </View>
                        )}
                    </View>
                </AppCard>

                {/* بخش ۲: آمار کلی (کامل شده) */}
                <AppCard style={styles.statsCard}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="chart-bar" size={22} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>آمار عملکرد</Text>
                    </View>

                    <View style={styles.statsGrid}>
                        <StatItem label="کل مسابقات" value={stats.total_matches || 0} icon="tennis" color={colors.text} />
                        <StatItem label="مسابقات برده" value={stats.total_wins || 0} subtitle={`${stats.win_percentage || 0}%`} icon="trophy" color={colors.success} />
                        <StatItem label="امتیازات برده" value={stats.total_points_won || 0} icon="target" color={colors.primary} />
                        <StatItem label="ایس (Ace)" value={stats.total_aces || 0} icon="lightning-bolt" color={colors.warning} />
                    </View>
                </AppCard>

                {/* بخش ۳: تاریخچه مسابقات */}
                <AppCard style={styles.matchesCard}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="history" size={22} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>تاریخچه مسابقات ({matches.length})</Text>
                    </View>

                    {matches.length === 0 ? (
                        <View style={styles.emptyMatches}>
                            <MaterialCommunityIcons name="tennis-ball" size={48} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>هنوز مسابقه‌ای ثبت نشده است</Text>
                        </View>
                    ) : (
                        <View style={styles.matchesList}>
                            {matches.slice(0, 10).map((match) => (
                                <View
                                    key={match.id}
                                    style={[styles.matchItem, { backgroundColor: colors.surfaceVariant }]}
                                >
                                    <View style={styles.matchInfo}>
                                        <Text style={[styles.opponentName, { color: colors.text }]}>vs {match.opponent_name}</Text>
                                        <Text style={[styles.matchDate, { color: colors.textSecondary }]}>
                                            {formatPersianDate(match.match_date)}
                                        </Text>
                                    </View>
                                    <View style={styles.matchStatus}>
                                        {match.status === 'completed' && (
                                            <View style={[styles.statusBadge, { backgroundColor: match.final_result === 'win' ? colors.success + '20' : colors.error + '20' }]}>
                                                <Text style={[styles.statusText, { color: match.final_result === 'win' ? colors.success : colors.error }]}>
                                                    {match.final_result === 'win' ? 'برد' : 'باخت'}
                                                </Text>
                                            </View>
                                        )}
                                        {match.status === 'ongoing' && (
                                            <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                                                <Text style={[styles.statusText, { color: colors.warning }]}>در جریان</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </AppCard>

                {/* دکمه‌های عملیات */}
                <View style={styles.buttonContainer}>
                    <ModernButton
                        title="ایجاد مسابقه جدید"
                        onPress={() => navigation.navigate('CreateMatch', { studentId })}
                        variant="primary"
                        icon="plus"
                        fullWidth
                    />
                </View>
            </ScrollView>

            {/* Dialog تأیید حذف */}
            <ConfirmationDialog
                visible={deleteDialogVisible}
                title="حذف شاگرد"
                message={`آیا مطمئن هستید که می‌خواهید ${student.name} را حذف کنید؟ تمام مسابقات و تحلیل‌های مرتبط نیز حذف خواهند شد.`}
                icon="alert-circle"
                iconColor={colors.error}
                onDismiss={() => setDeleteDialogVisible(false)}
                actions={[
                    { label: 'انصراف', onPress: () => setDeleteDialogVisible(false), variant: 'cancel' },
                    { label: 'حذف', onPress: handleDelete, variant: 'destructive', icon: 'delete' },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { paddingBottom: SPACING.xxxl },
    infoCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.md },
    avatarContainer: { alignItems: 'center', marginBottom: SPACING.xl },
    avatar: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
    studentName: { fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold, marginBottom: SPACING.xs },
    joinDate: { fontSize: TYPOGRAPHY.fontSize.sm },
    infoSection: { gap: SPACING.md },
    infoRow: { flexDirection: 'row-reverse', alignItems: 'center' },
    infoText: { flex: 1, fontSize: TYPOGRAPHY.fontSize.md, marginRight: SPACING.sm, textAlign: 'right' },
    statsCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
    cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', marginBottom: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)' },
    cardTitle: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold, marginRight: SPACING.sm, textAlign: 'right' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    matchesCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
    emptyMatches: { alignItems: 'center', paddingVertical: SPACING.xxl },
    emptyText: { fontSize: TYPOGRAPHY.fontSize.sm, marginTop: SPACING.md },
    matchesList: { gap: SPACING.sm },
    matchItem: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md },
    matchInfo: { flex: 1, alignItems: 'flex-start' },
    opponentName: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold, marginBottom: 2 },
    matchDate: { fontSize: TYPOGRAPHY.fontSize.xs },
    matchStatus: {},
    statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.pill },
    statusText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold },
    buttonContainer: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
    editButtonContainer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, marginBottom: SPACING.sm },
    statsCardSkeleton: { borderRadius: RADIUS.xl, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, padding: SPACING.lg },
});