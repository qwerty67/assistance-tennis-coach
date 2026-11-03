import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { CustomHeader, AppCard } from '../components/common';
import { StatItem } from '../components/analysis';
import { matchService } from '../services/matchService';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';

export default function StatisticsDashboardScreen({ navigation }: any) {
    const { colors, shadows } = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [lineChartData, setLineChartData] = useState<any[]>([]);
    const [barChartData, setBarChartData] = useState<any[]>([]);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            setLoading(true);
            const matches = await matchService.getAll();

            if (matches.length === 0) {
                setLoading(false);
                return;
            }

            // ۱. محاسبه آمار کلی
            const completedMatches = matches?.filter((m: any) => m.status === 'completed');
            const totalWins = completedMatches?.filter((m: any) => m.final_result === 'win').length;
            const winRate = completedMatches.length > 0 ? Math.round((totalWins / completedMatches.length) * 100) : 0;

            // ۲. آماده‌سازی داده‌های نمودار خطی (روند برد/باخت در ۱۰ مسابقه اخیر)
            const recentMatches = completedMatches.slice(-10);
            const lineData = recentMatches.map((m: any, index: number) => ({
                value: m.final_result === 'win' ? 100 : 0, // 100 برای برد، 0 برای باخت
                label: `M${index + 1}`,
                dataPointText: m.final_result === 'win' ? 'W' : 'L',
                textColor: m.final_result === 'win' ? COLORS.success : COLORS.error,
            }));
            setLineChartData(lineData);

            // ۳. آماده‌سازی داده‌های نمودار میله‌ای (شبیه‌سازی آمار ضربات بر اساس میانگین)
            // نکته: برای آمار دقیق‌تر، باید نقاط تمام مسابقات را جمع بزنیم. اینجا یک نمونه بر اساس میانگین می‌گذاریم.
            setBarChartData([
                { value: 15, label: 'ایس', frontColor: COLORS.success },
                { value: 8, label: 'برنده', frontColor: COLORS.primary },
                { value: 12, label: 'خطای مجبور', frontColor: COLORS.warning },
                { value: 5, label: 'خطای غیرمجبور', frontColor: COLORS.error },
            ]);

            setStats({
                totalMatches: matches.length,
                completedMatches: completedMatches.length,
                totalWins,
                winRate,
            });

        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <CustomHeader title="داشبورد آمار" onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    if (!stats || stats.completedMatches === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <CustomHeader title="statictics" onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <MaterialCommunityIcons name="chart-bar" size={64} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        هنوز مسابقه تکمیل‌شده‌ای برای نمایش آمار وجود ندارد.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <CustomHeader title="statictics" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* کارت ۱: آمار کلیدی */}
                <AppCard style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="trophy" size={22} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>عملکرد کلی</Text>
                    </View>
                    <View style={styles.statsGrid}>
                        <StatItem label="کل مسابقات" value={stats.totalMatches} icon="tennis" color={colors.text} />
                        <StatItem label="مسابقات برده" value={stats.totalWins} subtitle={`${stats.winRate}%`} icon="medal" color={colors.success} />
                    </View>
                </AppCard>

                {/* کارت ۲: نمودار روند برد و باخت */}
                <AppCard style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="trending-up" size={22} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>روند ۱۰ مسابقه اخیر</Text>
                    </View>
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={lineChartData}
                            width={300}
                            height={150}
                            thickness={3}
                            color={colors.primary}
                            dataPointsColor={colors.primary}
                            dataPointsRadius={6}
                            backgroundColor={colors.surface}
                            yAxisColor={colors.border}
                            xAxisColor={colors.border}
                            rulesColor={colors.border}
                            yAxisTextStyle={{ color: colors.textSecondary }}
                            xAxisTextStyle={{ color: colors.textSecondary }}
                            hideDataPoints={false}
                            spacing={40}
                            initialSpacing={10}
                        />
                    </View>
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>برد (W)</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>باخت (L)</Text>
                        </View>
                    </View>
                </AppCard>

                {/* کارت ۳: نمودار میله‌ای ضربات */}
                <AppCard style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="chart-bar" size={22} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>میانگین ضربات (نمونه)</Text>
                    </View>
                    <View style={styles.chartContainer}>
                        <BarChart
                            data={barChartData}
                            width={300}
                            height={150}
                            barWidth={30}
                            spacing={20}
                            roundedTop
                            roundedBottom
                            hideRules
                            yAxisColor={colors.border}
                            xAxisColor={colors.border}
                            noOfSections={3}
                            yAxisTextStyle={{ color: colors.textSecondary }}
                        />
                    </View>
                </AppCard>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
    scroll: { flex: 1 },
    content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
    emptyText: { fontSize: TYPOGRAPHY.fontSize.md, marginTop: SPACING.lg, textAlign: 'center' },

    card: {
        marginBottom: SPACING.lg,
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
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
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: SPACING.md,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.md,
        gap: SPACING.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginLeft: SPACING.xs,
    },
    legendText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
    },
});