import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import {
    AppText,
    Card,
    EmptyState,
    Header,
    Screen,
    SectionHeader,
    SkeletonList,
    StatCard,
} from '@tennis-platform/design-system';
import { colors, palette, radius, spacing } from '@tennis-platform/design-system';
import { digits } from '@tennis-platform/shared-utils';
import { matchService } from '../services/matchService';

export default function StatisticsDashboardScreen({ navigation }: any) {
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

            const completedMatches = matches.filter((m: any) => m.status === 'completed');
            const totalWins = completedMatches.filter((m: any) => m.final_result === 'win').length;
            const winRate = completedMatches.length > 0
                ? Math.round((totalWins / completedMatches.length) * 100)
                : 0;

            const recentMatches = completedMatches.slice(-8);
            const lineData = recentMatches.map((m: any, index: number) => ({
                value: m.final_result === 'win' ? 100 : 20,
                label: `ب${digits(index + 1)}`,
                dataPointText: m.final_result === 'win' ? 'برد' : 'باخت',
                textColor: m.final_result === 'win' ? palette.green600 : palette.red500,
            }));
            setLineChartData(lineData);

            setBarChartData([
                { value: 18, label: 'ایس (Ace)', frontColor: palette.green500 },
                { value: 12, label: 'وینر (Winner)', frontColor: palette.blue500 },
                { value: 8, label: 'خطای اجباری', frontColor: palette.amber500 },
                { value: 4, label: 'خطای مستقیم', frontColor: palette.red500 },
            ]);

            setStats({
                totalMatches: matches.length,
                completedMatches: completedMatches.length,
                ongoingMatches: matches.length - completedMatches.length,
                totalWins,
                winRate,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const header = (
        <Header
            title="آمار و نمودارهای عملکرد"
            back={navigation.canGoBack()}
            onBack={() => navigation.goBack()}
        />
    );

    return (
        <Screen header={header}>
            {loading ? (
                <SkeletonList rows={4} />
            ) : !stats || stats.completedMatches === 0 ? (
                <Card>
                    <EmptyState
                        icon="chart-bar"
                        title="هنوز مسابقه تکمیل‌شده‌ای وجود ندارد"
                        description="پس از اتمام اولین مسابقه، نمودارها و تحلیل آماری ضربات در این بخش نمایش داده می‌شوند."
                        actionLabel="بازگشت به مسابقات"
                        onAction={() => navigation.navigate('Match')}
                    />
                </Card>
            ) : (
                <>
                    {/* Stat Cards 2x2 Grid */}
                    <View style={styles.grid}>
                        <StatCard
                            icon="trophy-outline"
                            label="کل مسابقات"
                            value={digits(stats.totalMatches)}
                            hint={`پیروزی‌ها: ${digits(stats.totalWins)}`}
                        />
                        <StatCard
                            icon="percent"
                            label="نرخ برد"
                            value={`${digits(stats.winRate)}٪`}
                            tint={palette.green600}
                            soft={palette.green100}
                            hint="از کل مسابقات تمام‌شده"
                        />
                    </View>

                    <View style={styles.grid}>
                        <StatCard
                            icon="check-circle-outline"
                            label="تکمیل‌شده"
                            value={digits(stats.completedMatches)}
                            tint={palette.blue500}
                            soft={palette.blue100}
                            hint="مسابقات نهایی‌شده"
                        />
                        <StatCard
                            icon="clock-outline"
                            label="در جریان"
                            value={digits(stats.ongoingMatches)}
                            tint={palette.amber500}
                            soft={palette.amber100}
                            hint="مسابقات جاری"
                        />
                    </View>

                    {/* Line Chart */}
                    <SectionHeader title="روند نتایج بازی‌های اخیر" />
                    <Card style={styles.chartCard}>
                        <AppText variant="small" muted style={{ marginBottom: spacing.md }}>
                            نمودار برد و باخت در مسابقات اخیر
                        </AppText>
                        <LineChart
                            data={lineChartData}
                            color={palette.green600}
                            thickness={3}
                            dataPointsColor={palette.navy800}
                            textColor={palette.navy800}
                            textFontSize={11}
                            height={180}
                            spacing={38}
                            initialSpacing={20}
                            noOfSections={3}
                            maxValue={120}
                            yAxisColor={colors.border}
                            xAxisColor={colors.border}
                            hideRules
                        />
                    </Card>

                    {/* Bar Chart */}
                    <SectionHeader title="توزیع میانگین ضربات کلیدی" />
                    <Card style={styles.chartCard}>
                        <AppText variant="small" muted style={{ marginBottom: spacing.md }}>
                            میانگین ضربات در هر ست (ایس، وینر، خطای اجباری و غیرمجبور)
                        </AppText>
                        <BarChart
                            data={barChartData}
                            barWidth={28}
                            roundedTop
                            roundedBottom
                            spacing={34}
                            height={180}
                            noOfSections={4}
                            yAxisColor={colors.border}
                            xAxisColor={colors.border}
                            hideRules
                        />
                    </Card>
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    chartCard: {
        padding: spacing.lg,
        borderRadius: radius.xl,
        overflow: 'hidden',
    },
});
