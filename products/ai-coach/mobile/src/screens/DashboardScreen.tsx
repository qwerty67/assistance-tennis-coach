import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import {
    AppText,
    Avatar,
    Badge,
    Card,
    EmptyState,
    Header,
    IconButton,
    ListRow,
    PressableScale,
    SectionHeader,
    StatCard,
    SkeletonList,
} from '@tennis-platform/design-system';
import { colors, palette, radius, shadows, spacing } from '@tennis-platform/design-system';
import { digits, formatDate } from '@tennis-platform/shared-utils';

import { matchService } from '../services/matchService';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import { Match, Student } from '../types';

export default function DashboardScreen({ navigation }: any) {
    const { user } = useAuth();
    const [matches, setMatches] = useState<Match[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = async () => {
        try {
            const [matchesData, studentsData] = await Promise.all([
                matchService.getAll(),
                studentService.getAll(),
            ]);
            setMatches(matchesData);
            setStudents(studentsData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const completedMatches = matches.filter((m) => m.status === 'completed');
    const ongoingMatches = matches.filter((m) => m.status === 'ongoing');
    const totalWins = completedMatches.filter((m) => m.final_result === 'win').length;
    const winPercentage = completedMatches.length > 0
        ? Math.round((totalWins / completedMatches.length) * 100)
        : 0;

    const recentMatches = [...matches]
        .sort((a, b) => new Date(b.match_date || b.created_at || '').getTime() - new Date(a.match_date || a.created_at || '').getTime())
        .slice(0, 5);

    const hour = dayjs().hour();
    const greeting = hour < 12 ? 'صبح بخیر' : hour < 17 ? 'عصر بخیر' : 'شب بخیر';
    const coachName = user?.first_name || user?.full_name || 'مربی';

    return (
        <View style={styles.container}>
            {/* Top Unified Header */}
            <View style={styles.header}>
                <PressableScale onPress={() => navigation.navigate('Settings')}>
                    <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} size={46} />
                </PressableScale>

                <View style={styles.headerText}>
                    <AppText variant="small" muted>
                        {`${greeting} · ${formatDate(new Date(), 'dddd D MMMM')}`}
                    </AppText>
                    <View style={styles.nameRow}>
                        <AppText variant="h2">{coachName}</AppText>
                        <View style={styles.aiBadge}>
                            <MaterialCommunityIcons name="robot" size={12} color={palette.violet500} />
                            <AppText variant="caption" color={palette.violet500} style={{ fontWeight: '700' }}>
                                AI
                            </AppText>
                        </View>
                    </View>
                </View>

                <IconButton
                    icon="chart-bar"
                    onPress={() => navigation.navigate('Statistics')}
                    accessibilityLabel="آمار"
                />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <SkeletonList rows={5} />
                ) : (
                    <>
                        {/* Hero Card for AI Match / Ongoing match */}
                        {ongoingMatches.length > 0 ? (
                            <Card
                                onPress={() => navigation.navigate('LiveMatch', { matchId: ongoingMatches[0].id })}
                                style={styles.ongoingHero}
                            >
                                <View style={styles.heroRow}>
                                    <View style={styles.pulseDot} />
                                    <AppText variant="bodyMedium" color="#FFFFFF">
                                        مسابقه زنده در جریان
                                    </AppText>
                                    <Badge label="LIVE" color={palette.red500} bg="rgba(255,255,255,0.9)" />
                                </View>
                                <AppText variant="h1" color="#FFFFFF">
                                    {ongoingMatches[0].opponent_name}
                                </AppText>
                                <AppText variant="small" color="rgba(255,255,255,0.8)">
                                    برای ثبت امتیازات و تحلیل ضربات کلیک کنید
                                </AppText>
                            </Card>
                        ) : (
                            <Card
                                onPress={() => navigation.navigate('Match', { screen: 'CreateMatch' })}
                                style={styles.heroCard}
                            >
                                <View style={styles.heroContent}>
                                    <View style={{ flex: 1, gap: 4 }}>
                                        <View style={styles.heroTag}>
                                            <MaterialCommunityIcons name="tennis" size={14} color={palette.lime400} />
                                            <AppText variant="caption" color={palette.lime400} style={{ fontWeight: '700' }}>
                                                دستیار هوشمند بازی
                                            </AppText>
                                        </View>
                                        <AppText variant="h2" color="#FFFFFF">
                                            ثبت و تحلیل مسابقه جدید
                                        </AppText>
                                        <AppText variant="small" color="rgba(255,255,255,0.75)">
                                            ثبت هوشمند ضربات، بردها و خطاهای بازیکن با هوش مصنوعی
                                        </AppText>
                                    </View>
                                    <View style={styles.heroIconBox}>
                                        <MaterialCommunityIcons name="plus" size={28} color={palette.navy900} />
                                    </View>
                                </View>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => navigation.navigate('Match', { screen: 'CreateMatch' })}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: palette.green100 }]}>
                                    <MaterialCommunityIcons name="tennis" size={22} color={palette.green600} />
                                </View>
                                <AppText variant="small" style={{ fontWeight: '600' }}>مسابقه جدید</AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => navigation.navigate('Students', { screen: 'AddStudent' })}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: palette.blue100 }]}>
                                    <MaterialCommunityIcons name="account-plus" size={22} color={palette.blue500} />
                                </View>
                                <AppText variant="small" style={{ fontWeight: '600' }}>شاگرد جدید</AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => navigation.navigate('Statistics')}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: palette.violet100 }]}>
                                    <MaterialCommunityIcons name="chart-bell-curve" size={22} color={palette.violet500} />
                                </View>
                                <AppText variant="small" style={{ fontWeight: '600' }}>آنالیز هوشمند</AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => navigation.navigate('Students')}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: palette.amber100 }]}>
                                    <MaterialCommunityIcons name="account-group" size={22} color={palette.amber500} />
                                </View>
                                <AppText variant="small" style={{ fontWeight: '600' }}>لیست شاگردان</AppText>
                            </TouchableOpacity>
                        </View>

                        {/* 2x2 Stats Grid */}
                        <View style={styles.grid}>
                            <StatCard
                                icon="trophy-outline"
                                label="کل مسابقات"
                                value={digits(matches.length)}
                                hint={`پیروزی: ${digits(totalWins)}`}
                                onPress={() => navigation.navigate('Match')}
                            />
                            <StatCard
                                icon="percent"
                                label="نرخ پیروزی"
                                value={`${digits(winPercentage)}٪`}
                                tint={palette.green600}
                                soft={palette.green100}
                                hint={`تکمیل‌شده: ${digits(completedMatches.length)}`}
                            />
                        </View>

                        <View style={styles.grid}>
                            <StatCard
                                icon="account-group-outline"
                                label="تعداد شاگردان"
                                value={digits(students.length)}
                                tint={palette.blue500}
                                soft={palette.blue100}
                                hint="ثبت‌شده در پلتفرم"
                                onPress={() => navigation.navigate('Students')}
                            />
                            <StatCard
                                icon="robot-outline"
                                label="تحلیل هوشمند"
                                value={digits(completedMatches.length)}
                                tint={palette.violet500}
                                soft={palette.violet100}
                                hint="گزارشات تولیدشده"
                                onPress={() => navigation.navigate('Statistics')}
                            />
                        </View>

                        {/* Recent Matches Section */}
                        <SectionHeader
                            title="مسابقات اخیر"
                            count={recentMatches.length}
                            action="همه مسابقات"
                            onAction={() => navigation.navigate('Match')}
                        />

                        {recentMatches.length === 0 ? (
                            <Card>
                                <EmptyState
                                    icon="tennis"
                                    title="هنوز مسابقه‌ای ثبت نشده است"
                                    description="اولین مسابقه شاگرد خود را ثبت کنید و عملکرد او را با هوش مصنوعی آنالیز نمایید."
                                    actionLabel="ثبت مسابقه جدید"
                                    onAction={() => navigation.navigate('Match', { screen: 'CreateMatch' })}
                                />
                            </Card>
                        ) : (
                            <Card padded={false} style={{ paddingHorizontal: spacing.md }}>
                                {recentMatches.map((m, idx) => {
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
                                            subtitle={m.match_date ? formatDate(m.match_date) : 'مسابقه تنیس'}
                                            right={
                                                <Badge
                                                    label={statusLabel}
                                                    color={statusColor}
                                                    bg={statusBg}
                                                />
                                            }
                                            onPress={() => {
                                                if (isOngoing) {
                                                    navigation.navigate('LiveMatch', { matchId: m.id });
                                                } else {
                                                    navigation.navigate('MatchDetails', { matchId: m.id });
                                                }
                                            }}
                                            divider={idx < recentMatches.length - 1}
                                        />
                                    );
                                })}
                            </Card>
                        )}

                        {/* Active Students Section */}
                        <SectionHeader
                            title="شاگردان"
                            count={students.length}
                            action="مدیریت"
                            onAction={() => navigation.navigate('Students')}
                        />

                        {students.length === 0 ? (
                            <Card>
                                <EmptyState
                                    icon="account-group"
                                    title="شاگردی یافت نشد"
                                    description="شاگردان خود را ثبت کنید تا مسابقات آنها ثبت و با هوش مصنوعی ارزیابی شود."
                                    actionLabel="افزودن شاگرد"
                                    onAction={() => navigation.navigate('Students', { screen: 'AddStudent' })}
                                />
                            </Card>
                        ) : (
                            <Card padded={false} style={{ paddingHorizontal: spacing.md }}>
                                {students.slice(0, 4).map((s, idx) => (
                                    <ListRow
                                        key={s.id}
                                        left={<Avatar name={s.name} size={40} />}
                                        title={s.name}
                                        subtitle={s.phone || 'بدون شماره'}
                                        right={
                                            <Badge
                                                label={s.level ? `سطح ${s.level}` : 'فعال'}
                                                color={palette.navy800}
                                                bg={colors.surfaceMuted}
                                            />
                                        }
                                        onPress={() => navigation.navigate('StudentDetails', { studentId: s.id })}
                                        divider={idx < Math.min(students.length, 4) - 1}
                                    />
                                ))}
                            </Card>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl + spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        gap: spacing.md,
    },
    headerText: {
        flex: 1,
        gap: 2,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: radius.pill,
        backgroundColor: palette.violet100,
    },
    scroll: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 120,
        gap: spacing.lg,
    },
    heroCard: {
        backgroundColor: palette.navy900,
        borderRadius: radius.xl,
        padding: spacing.xl,
        ...shadows.floating,
    },
    ongoingHero: {
        backgroundColor: palette.navy800,
        borderRadius: radius.xl,
        padding: spacing.xl,
        gap: spacing.sm,
        borderColor: palette.red500,
        borderWidth: 1.5,
        ...shadows.floating,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: palette.red500,
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    heroTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    heroIconBox: {
        width: 48,
        height: 48,
        borderRadius: radius.lg,
        backgroundColor: palette.lime400,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.xs,
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: 2,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
});
