import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    AppText,
    Avatar,
    Badge,
    Button,
    Card,
    EmptyState,
    Header,
    ListRow,
    Screen,
    SectionHeader,
    SkeletonList,
    StatCard,
} from '@tennis-platform/design-system';
import { colors, palette, radius, spacing } from '@tennis-platform/design-system';
import { digits, formatDate } from '@tennis-platform/shared-utils';
import { studentService } from '../services/studentService';
import { matchService } from '../services/matchService';
import { Match } from '../types';
import { useToast } from '../context/ToastContext';

export default function StudentDetailsScreen({ route, navigation }: any) {
    const { studentId } = route.params;
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [student, setStudent] = useState<any>(null);
    const [matches, setMatches] = useState<Match[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [studentData, matchesData] = await Promise.all([
                studentService.getWithStats(studentId),
                matchService.getAll(),
            ]);

            setStudent(studentData?.data || studentData);
            const studentMatches = (matchesData || []).filter(
                (m: Match) => String(m.student_id) === String(studentId)
            );
            setMatches(studentMatches);
        } catch (error) {
            console.error('Error loading student:', error);
            // Fallback to simple getById
            try {
                const s = await studentService.getById(studentId);
                setStudent(s);
            } catch {
                toast.error('خطا در دریافت مشخصات شاگرد');
            }
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

    const handleDelete = () => {
        Alert.alert(
            'حذف شاگرد',
            `آیا از حذف «${student?.name || 'این شاگرد'}» اطمینان دارید؟`,
            [
                { text: 'انصراف', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await studentService.delete(studentId);
                            toast.success('شاگرد با موفقیت حذف شد');
                            navigation.goBack();
                        } catch (error) {
                            toast.error('خطا در حذف شاگرد');
                        }
                    },
                },
            ]
        );
    };

    const header = (
        <Header
            title="پروفایل بازیکن"
            back
            onBack={() => navigation.goBack()}
            rightAction={{
                icon: 'account-edit-outline',
                onPress: () => navigation.navigate('EditStudent', { studentId }),
            }}
        />
    );

    const stats = student?.stats || student || {};
    const totalMatches = stats.total_matches || matches.length || 0;
    const wins = stats.wins || matches.filter(m => m.final_result === 'win').length;
    const winRate = stats.win_rate || (totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0);

    return (
        <Screen header={header} refreshing={refreshing} onRefresh={onRefresh}>
            {loading ? (
                <SkeletonList rows={4} />
            ) : !student ? (
                <Card>
                    <EmptyState
                        icon="account-alert"
                        title="شاگرد یافت نشد"
                        actionLabel="بازگشت"
                        onAction={() => navigation.goBack()}
                    />
                </Card>
            ) : (
                <>
                    {/* Player Info Card */}
                    <Card style={styles.profileCard}>
                        <Avatar name={student.name} size={64} />
                        <View style={styles.profileInfo}>
                            <AppText variant="h2">{student.name}</AppText>
                            <View style={styles.badgesRow}>
                                <Badge
                                    label={student.level ? `سطح ${student.level}` : 'بازیکن فعال'}
                                    color={palette.navy800}
                                    bg={colors.surfaceMuted}
                                />
                            </View>
                            {student.phone ? (
                                <View style={styles.contactRow}>
                                    <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textMuted} />
                                    <AppText variant="small" muted>{digits(student.phone)}</AppText>
                                </View>
                            ) : null}
                            {student.email ? (
                                <View style={styles.contactRow}>
                                    <MaterialCommunityIcons name="email-outline" size={14} color={colors.textMuted} />
                                    <AppText variant="small" muted>{student.email}</AppText>
                                </View>
                            ) : null}
                        </View>
                    </Card>

                    {/* Stats 2x2 Grid */}
                    <View style={styles.grid}>
                        <StatCard
                            icon="trophy-outline"
                            label="کل مسابقات"
                            value={digits(totalMatches)}
                            hint={`پیروزی‌ها: ${digits(wins)}`}
                        />
                        <StatCard
                            icon="percent"
                            label="نرخ برد"
                            value={`${digits(winRate)}٪`}
                            tint={palette.green600}
                            soft={palette.green100}
                        />
                    </View>

                    {/* Coach Notes */}
                    {(student.notes || student.coach_notes) && (
                        <>
                            <SectionHeader title="یادداشت‌های مربی" />
                            <Card>
                                <AppText variant="body">
                                    {student.notes || student.coach_notes}
                                </AppText>
                            </Card>
                        </>
                    )}

                    {/* Match History */}
                    <SectionHeader
                        title="تاریخچه مسابقات این شاگرد"
                        count={matches.length}
                        action="مسابقه جدید"
                        onAction={() => navigation.navigate('CreateMatch', { preselectedStudentId: studentId })}
                    />

                    {matches.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon="tennis"
                                title="مسابقه‌ای برای این شاگرد ثبت نشده است"
                                description="اولین مسابقه را برای ثبت عملکرد و آنالیز این بازیکن ایجاد کنید."
                                actionLabel="ثبت مسابقه"
                                onAction={() => navigation.navigate('CreateMatch', { preselectedStudentId: studentId })}
                            />
                        </Card>
                    ) : (
                        <Card padded={false} style={{ paddingHorizontal: spacing.md }}>
                            {matches.map((m, idx) => {
                                const isWin = m.final_result === 'win';
                                const isOngoing = m.status === 'ongoing';
                                const statusLabel = isOngoing ? 'در جریان' : isWin ? 'برد' : 'باخت';
                                const statusColor = isOngoing ? palette.amber500 : isWin ? palette.green600 : palette.red500;
                                const statusBg = isOngoing ? palette.amber100 : isWin ? palette.green100 : palette.red100;

                                return (
                                    <ListRow
                                        key={m.id}
                                        left={<Avatar name={m.opponent_name || 'حریف'} size={40} />}
                                        title={`در برابر ${m.opponent_name}`}
                                        subtitle={m.match_date ? formatDate(m.match_date) : 'مسابقه'}
                                        right={<Badge label={statusLabel} color={statusColor} bg={statusBg} />}
                                        onPress={() => {
                                            if (isOngoing) {
                                                navigation.navigate('LiveMatch', { matchId: m.id });
                                            } else {
                                                navigation.navigate('MatchDetails', { matchId: m.id });
                                            }
                                        }}
                                        divider={idx < matches.length - 1}
                                    />
                                );
                            })}
                        </Card>
                    )}

                    {/* Danger zone / Delete button */}
                    <View style={styles.actionSection}>
                        <Button
                            title="حذف شاگرد از پلتفرم"
                            onPress={handleDelete}
                            variant="danger"
                            icon="trash-can-outline"
                            fullWidth
                            size="md"
                        />
                    </View>
                </>
            )}
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
        gap: 3,
    },
    badgesRow: {
        flexDirection: 'row',
        marginVertical: 2,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    grid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    actionSection: {
        marginTop: spacing.md,
    },
});
