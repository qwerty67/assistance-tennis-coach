import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {CustomHeader, AppCard, ModernButton, SkeletonCard} from '../components/common';
import { StatItem } from '../components/analysis';
import { matchService } from '../services/matchService';
import { studentService } from '../services/studentService';
import { Match } from '../types';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { useTheme } from '../context/ThemeContext';

// ✅ فلگ‌های کنترل نمایش بخش‌های مختلف
interface DashboardSections {
    showOverview: boolean;      // کارت خلاصه وضعیت
    showQuickActions: boolean;  // دکمه‌های اقدام سریع
    showRecentMatches: boolean; // مسابقات اخیر
    showTopStudents: boolean;   // شاگردان برتر
    showStatsChart: boolean;    // نمودار آمار
}

// ✅ تنظیمات پیش‌فرض - می‌توانید هر کدام را false کنید
const DASHBOARD_SECTIONS: DashboardSections = {
    showOverview: true,
    showQuickActions: false,
    showRecentMatches: true,
    showTopStudents: true, // فعلاً غیرفعال
    showStatsChart: true,
};

export default function DashboardScreen({ navigation }: any) {
    const { colors, shadows } = useTheme();

    const [matches, setMatches] = useState<Match[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const matchesData = await matchService.getAll();
            const studentsData = await studentService.getAll();

            // محاسبه آمار
            const completedMatches = matchesData.filter((m: any) => m.status === 'completed');
            const ongoingMatches = matchesData.filter((m: any) => m.status === 'ongoing');
            const totalWins = completedMatches.filter((m: any) => m.final_result === 'win').length;
            const winPercentage = completedMatches.length > 0
                ? Math.round((totalWins / completedMatches.length) * 100)
                : 0;

            setStats({
                totalMatches: matchesData.length,
                completedMatches: completedMatches.length,
                ongoingMatches: ongoingMatches.length,
                totalWins,
                winPercentage,
                totalStudents: studentsData.length,
            });

            setMatches(matchesData);
            setStudents(studentsData);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const formatPersianDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('fa-IR', {
                month: 'short',
                day: 'numeric',
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    const getStatusColor = (status: string, finalResult?: string) => {
        if (status === 'completed') {
            return finalResult === 'win' ? colors.success : colors.error;
        }
        if (status === 'ongoing') return colors.warning;
        return colors.textSecondary;
    };

    const getStatusText = (status: string, finalResult?: string) => {
        if (status === 'completed') {
            return finalResult === 'win' ? 'برد' : 'باخت';
        }
        if (status === 'ongoing') return 'در جریان';
        return 'نامشخص';
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <CustomHeader title="Dashboard" />
                <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </ScrollView>
            </View>
        );
    }

    const recentMatches = matches
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
        .slice(0, 5);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <CustomHeader
                title="TennisPilot"
                subtitle={`Dashboard`}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* ✅ بخش ۱: کارت خلاصه وضعیت */}
                {DASHBOARD_SECTIONS.showOverview && stats && (
                    <View style={styles.overviewContainer}>
                        {/* کارت اصلی با گرادیان */}
                        <View style={[
                            styles.mainOverviewCard,
                            {
                                backgroundColor: colors.primary,
                                shadowColor: colors.primary,
                            }
                        ]}>
                            <View style={styles.overviewHeader}>
                                <View>
                                    <Text style={styles.overviewTitle}>Overviews</Text>
                                    <Text style={styles.overviewSubtitle}>
                                        {stats.totalMatches} match
                                    </Text>
                                </View>
                                <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <MaterialCommunityIcons name="trophy" size={32} color="#FFF" />
                                </View>
                            </View>

                            <View style={styles.overviewStats}>
                                <View style={styles.overviewStatItem}>
                                    <Text style={styles.overviewStatValue}>{stats.winPercentage}%</Text>
                                    <Text style={styles.overviewStatLabel}>win rate</Text>
                                </View>
                                <View style={[styles.overviewDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                                <View style={styles.overviewStatItem}>
                                    <Text style={styles.overviewStatValue}>{stats.totalWins}</Text>
                                    <Text style={styles.overviewStatLabel}>پیروزی</Text>
                                </View>
                                <View style={[styles.overviewDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                                <View style={styles.overviewStatItem}>
                                    <Text style={styles.overviewStatValue}>{stats.ongoingMatches}</Text>
                                    <Text style={styles.overviewStatLabel}>در جریان</Text>
                                </View>
                            </View>
                        </View>

                        {/* کارت‌های کوچک پایین */}
                        <View style={styles.miniCardsRow}>
                            <View style={[styles.miniCard, { backgroundColor: colors.surface, ...shadows.sm }]}>
                                <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
                                <Text style={[styles.miniCardValue, { color: colors.text }]}>{stats.totalStudents}</Text>
                                <Text style={[styles.miniCardLabel, { color: colors.textSecondary }]}>شاگردان</Text>
                            </View>

                            <View style={[styles.miniCard, { backgroundColor: colors.surface, ...shadows.sm }]}>
                                <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                                <Text style={[styles.miniCardValue, { color: colors.text }]}>{stats.completedMatches}</Text>
                                <Text style={[styles.miniCardLabel, { color: colors.textSecondary }]}>تکمیل شده</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ✅ بخش ۲: دکمه‌های اقدام سریع */}
                {DASHBOARD_SECTIONS.showQuickActions && (
                    <AppCard style={styles.sectionCard}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="lightning-bolt" size={22} color={colors.accent || COLORS.warning} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>اقدامات سریع</Text>
                        </View>
                        <View style={styles.quickActionsGrid}>
                            <TouchableOpacity
                                style={[styles.quickActionBtn, { backgroundColor: colors.primary }]}
                                onPress={() => navigation.navigate('CreateMatch')}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
                                <Text style={styles.quickActionText}>create match</Text>
                            </TouchableOpacity>

                            {stats?.ongoingMatches! > 0 && (
                                <TouchableOpacity
                                    style={[styles.quickActionBtn, { backgroundColor: colors.warning }]}
                                    onPress={() => {
                                        const ongoing = matches.find((m: any) => m.status === 'ongoing');
                                        if (ongoing) navigation.navigate('LiveMatch', { matchId: ongoing.id });
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <MaterialCommunityIcons name="record-rec" size={28} color="#FFF" />
                                    <Text style={styles.quickActionText}>ادامه مسابقه</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.quickActionBtn, { backgroundColor: colors.success }]}
                                onPress={() => navigation.navigate('Statistics')}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="chart-bar" size={28} color="#FFF" />
                                <Text style={styles.quickActionText}>آمار کامل</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.quickActionBtn, { backgroundColor: colors.surfaceVariant || COLORS.background }]}
                                onPress={() => navigation.navigate('AddStudent')}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="account-plus" size={28} color={colors.primary} />
                                <Text style={[styles.quickActionText, { color: colors.primary }]}>شاگرد جدید</Text>
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                )}

                {/* ✅ بخش ۳: مسابقات اخیر */}
                {DASHBOARD_SECTIONS.showRecentMatches && (
                    <AppCard style={styles.sectionCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.headerLeft}>
                                <MaterialCommunityIcons name="tennis-ball" size={22} color={colors.primary} />
                                <Text style={[styles.cardTitle, { color: colors.text }]}>مسابقات اخیر</Text>
                            </View>
                            {/*<TouchableOpacity style={styles.seeAllButton}>*/}
                            {/*    <Text style={[styles.seeAllText, { color: colors.primary }]}>همه</Text>*/}
                            {/*    <MaterialCommunityIcons name="chevron-left" size={20} color={colors.primary} />*/}
                            {/*</TouchableOpacity>*/}
                        </View>

                        {recentMatches.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceVariant }]}>
                                    <MaterialCommunityIcons name="tennis-ball" size={48} color={colors.primary} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>هنوز مسابقه‌ای ثبت نشده</Text>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    اولین مسابقه خود را ثبت کنید
                                </Text>
                                <ModernButton
                                    title="ایجاد مسابقه"
                                    onPress={() => navigation.navigate('CreateMatch')}
                                    variant="primary"
                                    icon="plus"
                                    size="sm"
                                />
                            </View>
                        ) : (
                            <View style={styles.matchesList}>
                                {recentMatches.map((match: any, index: number) => {
                                    const isWin = match.final_result === 'win';
                                    const isOngoing = match.status === 'ongoing';

                                    return (
                                        <TouchableOpacity
                                            key={match.id}
                                            // onPress={() => {
                                            //     if (isOngoing) {
                                            //         navigation.navigate('LiveMatch', { matchId: match.id });
                                            //     } else {
                                            //         navigation.navigate('MatchDetails', { matchId: match.id });
                                            //     }
                                            // }}
                                            activeOpacity={0.7}
                                            style={[
                                                styles.matchCard,
                                                {
                                                    backgroundColor: colors.surface,
                                                    borderLeftWidth: 4,
                                                    borderLeftColor: isOngoing ? colors.warning : (isWin ? colors.success : colors.error)
                                                },
                                                shadows.sm
                                            ]}
                                        >
                                            <View style={styles.matchCardContent}>
                                                {/* ردیف بالا: حریف و وضعیت */}
                                                <View style={styles.matchTopRow}>
                                                    <View style={styles.opponentContainer}>
                                                        <View style={[
                                                            styles.opponentAvatar,
                                                            { backgroundColor: isOngoing ? colors.warning + '20' : (isWin ? colors.success + '20' : colors.error + '20') }
                                                        ]}>
                                                            <MaterialCommunityIcons
                                                                name={isOngoing ? 'clock-outline' : (isWin ? 'trophy' : 'account')}
                                                                size={20}
                                                                color={isOngoing ? colors.warning : (isWin ? colors.success : colors.error)}
                                                            />
                                                        </View>
                                                        <View>
                                                            <Text style={[styles.opponentName, { color: colors.text }]}>
                                                                {match.opponent_name}
                                                            </Text>
                                                            <Text style={[styles.matchDate, { color: colors.textSecondary }]}>
                                                                {formatPersianDate(match.match_date)}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    <View style={[
                                                        styles.statusChip,
                                                        {
                                                            backgroundColor: isOngoing ? colors.warning + '20' : (isWin ? colors.success + '20' : colors.error + '20')
                                                        }
                                                    ]}>
                                                        <MaterialCommunityIcons
                                                            name={isOngoing ? 'clock' : (isWin ? 'check-circle' : 'close-circle')}
                                                            size={16}
                                                            color={isOngoing ? colors.warning : (isWin ? colors.success : colors.error)}
                                                        />
                                                        <Text style={[
                                                            styles.statusText,
                                                            { color: isOngoing ? colors.warning : (isWin ? colors.success : colors.error) }
                                                        ]}>
                                                            {isOngoing ? 'در جریان' : (isWin ? 'برد' : 'باخت')}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* ردیف پایین: نتیجه و اکشن */}
                                                {match.sets_score && !isOngoing && (
                                                    <View style={styles.scoreRow}>
                                                        <View style={styles.scoreContainer}>
                                                            <MaterialCommunityIcons name="scoreboard" size={16} color={colors.textSecondary} />
                                                            <Text style={[styles.scoreText, { color: colors.textSecondary }]}>
                                                                {match.sets_score}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}

                                                {/*{isOngoing && (*/}
                                                {/*    <View style={styles.actionRow}>*/}
                                                {/*        <View style={[styles.continueBadge, { backgroundColor: colors.warning + '20' }]}>*/}
                                                {/*            <MaterialCommunityIcons name="record-rec" size={14} color={colors.warning} />*/}
                                                {/*            <Text style={[styles.continueText, { color: colors.warning }]}>*/}
                                                {/*                ادامه ثبت*/}
                                                {/*            </Text>*/}
                                                {/*        </View>*/}
                                                {/*    </View>*/}
                                                {/*)}*/}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </AppCard>
                )}
                {/* ✅ بخش ۴: شاگردان برتر (اختیاری) */}
                {DASHBOARD_SECTIONS.showTopStudents && students.length > 0 && (
                    <AppCard style={styles.sectionCard}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="star" size={22} color={colors.accent || COLORS.warning} />
                            <Text style={[styles.cardTitle, { color: colors.text }]}>شاگردان برتر</Text>
                        </View>
                        <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
                            این بخش به زودی اضافه می‌شود...
                        </Text>
                    </AppCard>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },

    loadingText: { fontSize: TYPOGRAPHY.fontSize.lg },

    sectionCard: {
        marginBottom: SPACING.lg,
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    cardTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginRight: SPACING.sm,
    },
    // seeAllText: {
    //     fontSize: TYPOGRAPHY.fontSize.sm,
    //     fontWeight: TYPOGRAPHY.fontWeight.medium,
    // },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    // Quick Actions
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    quickActionBtn: {
        width: '48%',
        padding: SPACING.lg,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        ...SHADOWS.sm,
    },
    quickActionText: {
        color: '#FFF',
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        marginTop: SPACING.xs,
        textAlign: 'center',
    },

    // Matches List
    emptyState: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        marginTop: SPACING.md,
        textAlign: 'center',
    },
    matchesList: {
        gap: SPACING.sm,
    },
    matchItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
    },
    matchInfo: {
        flex: 1,
        marginRight: SPACING.md,
    },
    matchHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    opponentName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    matchDate: {
        fontSize: TYPOGRAPHY.fontSize.xs,
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
    },
    statusText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },

    comingSoonText: {
        textAlign: 'center',
        paddingVertical: SPACING.xl,
        fontSize: TYPOGRAPHY.fontSize.md,
    },
    // استایل‌های بخش خلاصه وضعیت
    overviewContainer: {
        marginBottom: SPACING.lg,
    },
    mainOverviewCard: {
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    overviewHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
    },
    overviewTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: '#FFF',
        marginBottom: 4,
    },
    overviewSubtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    iconBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overviewStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    overviewStatItem: {
        alignItems: 'center',
    },
    overviewStatValue: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: '#FFF',
        marginBottom: 4,
    },
    overviewStatLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: 'rgba(255,255,255,0.8)',
    },
    overviewDivider: {
        width: 1,
        height: 40,
    },
    miniCardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: SPACING.md,
    },
    miniCard: {
        flex: 1,
        padding: SPACING.lg,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
    },
    miniCardValue: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginTop: SPACING.xs,
    },
    miniCardLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        marginTop: 2,
    },

// استایل‌های مسابقات اخیر
    headerLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    seeAllButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.pill,
    },
    seeAllText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        marginLeft: 2,
    },
    // emptyState: {
    //     alignItems: 'center',
    //     paddingVertical: SPACING.xxl,
    // },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginBottom: SPACING.xs,
    },
    // emptyText: {
    //     fontSize: TYPOGRAPHY.fontSize.sm,
    //     marginBottom: SPACING.lg,
    //     textAlign: 'center',
    // },
    // matchesList: {
    //     gap: SPACING.md,
    // },
    matchCard: {
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    matchCardContent: {
        padding: SPACING.md,
    },
    matchTopRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    opponentContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        flex: 1,
    },
    opponentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.md,
    },
    // opponentName: {
    //     fontSize: TYPOGRAPHY.fontSize.md,
    //     fontWeight: TYPOGRAPHY.fontWeight.semibold,
    // },
    // matchDate: {
    //     fontSize: TYPOGRAPHY.fontSize.xs,
    //     marginTop: 2,
    // },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
        gap: 4,
    },
    // statusText: {
    //     fontSize: TYPOGRAPHY.fontSize.xs,
    //     fontWeight: TYPOGRAPHY.fontWeight.bold,
    // },
    scoreRow: {
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    scoreText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    actionRow: {
        marginTop: SPACING.sm,
    },
    continueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
        gap: 4,
    },
    continueText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
});