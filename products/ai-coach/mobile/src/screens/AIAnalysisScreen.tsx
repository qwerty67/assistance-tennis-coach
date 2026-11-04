import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ActivityIndicator, ScrollView, RefreshControl} from 'react-native';
import {Text} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {
    CustomHeader,
    AppCard,
    ModernButton,
    ConfirmationDialog,
    SkeletonCard,
    SkeletonStatGrid
} from '../components/common';
import {StatItem, MarkdownReport, ShotDistributionChart} from '../components/analysis';
import {analysisService, AnalysisRecord} from '../services/analysisService';
import {useToast} from '../context/ToastContext';
import {useTheme} from '../context/ThemeContext'; // ✅ اضافه شد
import {SPACING, TYPOGRAPHY, RADIUS} from '../theme'; // COLORS حذف شد

export default function AIAnalysisScreen({route, navigation}: any) {
    const {matchId, match} = route.params;
    const {colors} = useTheme(); // ✅ دریافت تم داینامیک

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const [report, setReport] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState('');
    const [analysisId, setAnalysisId] = useState<number | null>(null);
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);
    const [isFromCache, setIsFromCache] = useState(false);

    const [reanalyzeDialogVisible, setReanalyzeDialogVisible] = useState(false);

    const toast = useToast();

    useEffect(() => {
        loadInitial();
    }, []);

    const loadInitial = async () => {
        try {
            setLoading(true);
            const cachedResult = await analysisService.getLatestAnalysis(matchId);

            if (cachedResult.success && cachedResult.markdown_report) {
                setReport(cachedResult.markdown_report);
                setStats(cachedResult.statistics);
                setAnalysisId(cachedResult.analysis_id);
                setIsFromCache(true);
                toast.success('تحلیل قبلی بارگذاری شد');
            } else {
                await runNewAnalysis();
                return;
            }
            await loadHistory();
        } catch (e: any) {
            await runNewAnalysis();
            return;
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const runNewAnalysis = async () => {
        try {
            setAnalyzing(true);
            setError('');
            const result = await analysisService.analyzeMatch(matchId);

            if (!result.success) {
                setError(result.error || 'تحلیل ناموفق بود');
                toast.error(result.error || 'تحلیل ناموفق بود');
                return;
            }
            if (!result.markdown_report) {
                setError('گزارشی دریافت نشد');
                toast.error('گزارشی دریافت نشد');
                return;
            }

            setReport(result.markdown_report);
            setStats(result.statistics);
            setAnalysisId(result.analysis_id || null);
            setIsFromCache(false);
            toast.success('آنالیز جدید انجام و ذخیره شد!');
            await loadHistory();
        } catch (e: any) {
            setError(e.message || 'خطا در بارگذاری');
            toast.error('خطا در بارگذاری');
        } finally {
            setAnalyzing(false);
            setRefreshing(false);
        }
    };

    const loadHistory = async () => {
        try {
            const historyResult = await analysisService.getAllAnalyses(matchId);
            if (historyResult.success) {
                setAnalysisHistory(historyResult.analyses);
            }
        } catch (e) {
            console.error('Error loading history:', e);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadInitial();
    };

    const formatPersianDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    if (loading || analyzing) {
        // return (
        //     <View style={[styles.container, { backgroundColor: colors.background }]}>
        //         <CustomHeader title="گزارش آنالیز" onBack={() => navigation.goBack()} />
        //         <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        //             <View style={[styles.statsCardSkeleton, { backgroundColor: colors.surface }]}>
        //                 <SkeletonStatGrid />
        //             </View>
        //             <SkeletonCard />
        //             <SkeletonCard />
        //         </ScrollView>
        //     </View>
        // );
        return (
            <View style={[styles.container, {backgroundColor: colors.background}]}>
                <CustomHeader title="AI Analysis Report" onBack={() => navigation.goBack()}/>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary}/>
                    {/*<Text style={{color: colors.text}}>هوش مصنوعی در حال کالبدشکافی داده‌هاست...</Text>*/}
                    {/*<Text >این فرآیند ممکن است چند ثانیه طول بکشد</Text>*/}
                    <Text style={{color: colors.text}}>
                        {analyzing ? 'هوش مصنوعی در حال کالبدشکافی داده‌هاست...' : 'در حال بارگذاری...'}
                    </Text>
                    <Text style={{color: colors.text}}>
                        {analyzing ? 'این فرآیند ممکن است چند ثانیه طول بکشد' : 'بررسی تحلیل‌های قبلی'}
                    </Text>

                </View>
                <SkeletonCard/>
                <SkeletonCard/>
            </View>
        );
    }

    if (error && !report) {
        return (
            <View style={[styles.container, {backgroundColor: colors.background}]}>
                <CustomHeader title="AI Analysis Report" onBack={() => navigation.goBack()}/>
                <View style={styles.center}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={64} color={colors.error}/>
                    <Text style={[styles.errorTitle, {color: colors.text}]}>خطا در تحلیل</Text>
                    <Text style={[styles.errorText, {color: colors.textSecondary}]}>{error}</Text>
                    <ModernButton title="تلاش مجدد" onPress={runNewAnalysis} variant="primary" icon="refresh"/>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <CustomHeader
                title="AI Analysis Report"
                subtitle={`vs ${match.opponent_name}`}
                onBack={() => navigation.goBack()}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                                                tintColor={colors.primary}/>}
                showsVerticalScrollIndicator={false}
            >
                {isFromCache && (
                    <View style={[styles.cacheBanner, {backgroundColor: colors.primaryLight}]}>
                        <MaterialCommunityIcons name="cached" size={18} color={colors.primary}/>
                        <Text style={[styles.cacheBannerText, {color: colors.text}]}>
                            این تحلیل قبلاً ذخیره شده است (بدون هزینه)
                        </Text>
                    </View>
                )}

                {stats && (
                    <AppCard style={styles.statsCard}>
                        <View style={[styles.cardHeader, {borderBottomColor: colors.border}]}>
                            <MaterialCommunityIcons name="chart-bar" size={22} color={colors.primary}/>
                            <Text style={[styles.cardTitle, {color: colors.text}]}>آمار کلیدی مسابقه</Text>
                        </View>
                        <View style={styles.statsGrid}>
                            <StatItem label="کل امتیازات" value={stats.total_points} icon="tennis-ball"
                                      color={colors.text}/>
                            <StatItem label="امتیازات برده" value={stats.student_points_won}
                                      subtitle={`${stats.win_percentage}%`} icon="trophy" color={colors.success}/>
                            <StatItem label="ایس (Ace)" value={stats.student_serve_stats.aces} icon="lightning-bolt"
                                      color={colors.primary}/>
                            <StatItem label="سرویس اول"
                                      value={`${stats.student_serve_stats.first_serve_percentage || 0}%`} icon="target"
                                      color={colors.warning}/>
                        </View>
                    </AppCard>
                )}

                {stats && stats.final_strokes && (
                    <ShotDistributionChart
                        winners={stats.final_strokes.student_winners}
                        forcedErrors={stats.final_strokes.student_forced_errors}
                        unforcedErrors={stats.final_strokes.student_unforced_errors}
                    />
                )}

                {report && (
                    <AppCard style={styles.reportCard}>
                        <View style={[styles.cardHeader, {borderBottomColor: colors.border}]}>
                            <MaterialCommunityIcons name="robot" size={22} color={colors.primary}/>
                            <Text style={[styles.cardTitle, {color: colors.text}]}>تحلیل تخصصی مربی</Text>
                        </View>
                        <MarkdownReport content={report}/>
                    </AppCard>
                )}

                {analysisHistory.length > 1 && (
                    <AppCard style={styles.historyCard}>
                        <View style={[styles.cardHeader, {borderBottomColor: colors.border}]}>
                            <MaterialCommunityIcons name="history" size={22} color={colors.primary}/>
                            <Text style={[styles.cardTitle, {color: colors.text}]}>تاریخچه تحلیل‌ها
                                ({analysisHistory.length})</Text>
                        </View>
                        {analysisHistory.map((analysis, index) => (
                            <View
                                key={analysis.id}
                                style={[
                                    styles.historyItem,
                                    {backgroundColor: colors.surface},
                                    analysis.id === analysisId && {
                                        backgroundColor: colors.success + '15',
                                        borderWidth: 1,
                                        borderColor: colors.success + '30'
                                    },
                                ]}
                            >
                                <View style={styles.historyItemLeft}>
                                    <MaterialCommunityIcons
                                        name={analysis.id === analysisId ? "check-circle" : "circle-outline"}
                                        size={20}
                                        color={analysis.id === analysisId ? colors.success : colors.textSecondary}
                                    />
                                    <View style={styles.historyTextContainer}>
                                        <Text style={[styles.historyDate, {color: colors.text}]}>
                                            {formatPersianDate(analysis.created_at)}
                                        </Text>
                                        <Text style={[styles.historyModel, {color: colors.textSecondary}]}>
                                            مدل: {analysis.model_used || 'نامشخص'}
                                        </Text>
                                    </View>
                                </View>
                                {analysis.id === analysisId && (
                                    <View style={[styles.currentBadge, {backgroundColor: colors.success}]}>
                                        <Text style={[styles.currentBadgeText, {color: '#FFFFFF'}]}>فعلی</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </AppCard>
                )}

                <View style={styles.buttonContainer}>
                    <ModernButton
                        title="تحلیل مجدد با AI"
                        onPress={() => setReanalyzeDialogVisible(true)}
                        variant="primary"
                        icon="robot"
                        fullWidth
                        loading={analyzing}
                    />
                    <View style={{height: SPACING.sm}}/>
                    <ModernButton
                        title="بروزرسانی صفحه"
                        onPress={onRefresh}
                        variant="outline"
                        icon="refresh"
                        fullWidth
                    />
                </View>
            </ScrollView>

            <ConfirmationDialog
                visible={reanalyzeDialogVisible}
                title="تحلیل مجدد با هوش مصنوعی"
                message="با انجام تحلیل مجدد، یک گزارش جدید با استفاده از هوش مصنوعی تولید و در دیتابیس ذخیره می‌شود. تحلیل قبلی در تاریخچه باقی می‌ماند. آیا مطمئن هستید؟"
                icon="robot"
                iconColor={colors.primary}
                onDismiss={() => setReanalyzeDialogVisible(false)}
                actions={[
                    {label: 'انصراف', onPress: () => setReanalyzeDialogVisible(false), variant: 'cancel'},
                    {
                        label: 'تحلیل مجدد', onPress: () => {
                            setReanalyzeDialogVisible(false);
                            runNewAnalysis();
                        }, variant: 'primary', icon: 'check'
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1}, // ✅ backgroundColor حذف شد
    center: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.sm},
    scroll: {flex: 1},
    content: {paddingBottom: SPACING.xxxl},

    cacheBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
    },
    cacheBannerText: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.sm,
        marginRight: SPACING.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },

    errorTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginTop: SPACING.lg,
    },
    errorText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        marginTop: SPACING.sm,
        marginBottom: SPACING.xl,
        textAlign: 'center',
    },

    statsCard: {
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    reportCard: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    historyCard: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
    },
    cardTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginRight: SPACING.sm,
        textAlign: 'right',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
    },
    historyItemLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        flex: 1,
    },
    historyTextContainer: {
        flex: 1,
        alignItems: 'flex-start',
        marginRight: SPACING.md,
    },
    historyDate: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    historyModel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        marginTop: 2,
    },
    currentBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.pill,
    },
    currentBadgeText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },

    buttonContainer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
    },
    statsCardSkeleton: {
        borderRadius: RADIUS.xl,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
});