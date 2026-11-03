import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomHeader, AppCard, ModernButton } from '../components/common';
import { RatingBadge, AnalysisCard, StatItem } from '../components/analysis';
import { analysisService } from '../services/analysisService';
import { Match, MatchAnalysis } from '../types';
import { useToast } from '../context/ToastContext';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';

interface AIAnalysisScreenProps {
    route: any;
    navigation: any;
}

export default function AIAnalysisScreenV1({ route, navigation }: AIAnalysisScreenProps) {
    const { matchId, match } = route.params as { matchId: number; match: Match };
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
    const [statistics, setStatistics] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    useEffect(() => {
        loadAnalysis();
    }, [matchId]);

    const loadAnalysis = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await analysisService.analyzeMatch(matchId);

            if (!response.success) {
                setError(response.error || 'Analysis failed');
                toast.error(response.error || 'Analysis failed');
                return;
            }

            setAnalysis(response.analysis);
            setStatistics(response.statistics);
            toast.success('Analysis completed!');
        } catch (err) {
            console.error('Error loading analysis:', err);
            setError('Failed to load analysis');
            toast.error('Failed to load analysis');
        } finally {
            setLoading(false);
        }
    };

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case 'excellent': return COLORS.success;
            case 'good': return COLORS.primary;
            case 'average': return COLORS.warning;
            case 'below_average': return COLORS.accent;
            case 'poor': return COLORS.error;
            default: return COLORS.textSecondary;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return COLORS.error;
            case 'medium': return COLORS.warning;
            case 'low': return COLORS.success;
            default: return COLORS.textSecondary;
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <CustomHeader title="AI Analysis" onBack={() => navigation.goBack()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Analyzing match...</Text>
                    <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
                </View>
            </View>
        );
    }

    if (error || !analysis) {
        return (
            <View style={styles.container}>
                <CustomHeader title="AI Analysis" onBack={() => navigation.goBack()} />
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={64} color={COLORS.error} />
                    <Text style={styles.errorTitle}>Analysis Failed</Text>
                    <Text style={styles.errorMessage}>{error || 'Unknown error'}</Text>
                    <ModernButton
                        title="Try Again"
                        onPress={loadAnalysis}
                        variant="primary"
                        icon="refresh"
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CustomHeader
                title="AI Analysis"
                subtitle={match.opponent_name}
                onBack={() => navigation.goBack()}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Overall Rating */}
                <AppCard style={styles.overallCard}>
                    <View style={styles.overallHeader}>
                        <View>
                            <Text style={styles.overallLabel}>Overall Performance</Text>
                            <Text style={styles.opponentName}>vs {match.opponent_name}</Text>
                        </View>
                        <RatingBadge rating={analysis.overall_rating} size="lg" />
                    </View>
                    <Text style={styles.summary}>{analysis.summary}</Text>
                </AppCard>

                {/* Statistics Grid */}
                {statistics && (
                    <AppCard style={styles.statsCard}>
                        <Text style={styles.sectionTitle}>Match Statistics</Text>
                        <View style={styles.statsGrid}>
                            <StatItem
                                label="Total Points"
                                value={statistics.total_points}
                            />
                            <StatItem
                                label="Points Won"
                                value={`${statistics.student_points_won}`}
                                subtitle={`${statistics.win_percentage}%`}
                                color={COLORS.primary}
                            />
                            <StatItem
                                label="Aces"
                                value={statistics.student_serve_stats.aces}
                            />
                            <StatItem
                                label="1st Serve %"
                                value={`${statistics.student_serve_stats.first_serve_percentage || 0}%`}
                            />
                        </View>
                    </AppCard>
                )}

                {/* Performance Analysis */}
                <View style={styles.performanceGrid}>
                    <AnalysisCard title="Serve" icon="tennis-ball" iconColor={COLORS.primary}>
                        <View style={styles.performanceHeader}>
                            <RatingBadge rating={analysis.serve_analysis.rating} size="sm" />
                        </View>
                        <Text style={styles.performanceNotes}>
                            {analysis.serve_analysis.notes}
                        </Text>
                    </AnalysisCard>

                    <AnalysisCard title="Return" icon="tennis" iconColor={COLORS.success}>
                        <View style={styles.performanceHeader}>
                            <RatingBadge rating={analysis.return_analysis.rating} size="sm" />
                        </View>
                        <Text style={styles.performanceNotes}>
                            {analysis.return_analysis.notes}
                        </Text>
                    </AnalysisCard>

                    <AnalysisCard title="Rally" icon="swap-horizontal" iconColor={COLORS.warning}>
                        <View style={styles.performanceHeader}>
                            <RatingBadge rating={analysis.rally_analysis.rating} size="sm" />
                        </View>
                        <Text style={styles.performanceNotes}>
                            {analysis.rally_analysis.notes}
                        </Text>
                    </AnalysisCard>

                    <AnalysisCard title="Mental Game" icon="brain" iconColor={COLORS.accent}>
                        <View style={styles.performanceHeader}>
                            <RatingBadge rating={analysis.mental_game.rating} size="sm" />
                        </View>
                        <Text style={styles.performanceNotes}>
                            {analysis.mental_game.notes}
                        </Text>
                    </AnalysisCard>
                </View>

                {/* Strengths */}
                <AnalysisCard title="Strengths" icon="check-circle" iconColor={COLORS.success}>
                    {analysis.strengths.map((strength, index) => (
                        <View key={index} style={styles.listItem}>
                            <View style={[styles.listIcon, { backgroundColor: COLORS.successLight }]}>
                                <MaterialCommunityIcons name="check" size={16} color={COLORS.success} />
                            </View>
                            <Text style={styles.listText}>{strength}</Text>
                        </View>
                    ))}
                </AnalysisCard>

                {/* Weaknesses */}
                <AnalysisCard title="Areas to Improve" icon="alert-circle" iconColor={COLORS.warning}>
                    {analysis.weaknesses.map((weakness, index) => (
                        <View key={index} style={styles.listItem}>
                            <View style={[styles.listIcon, { backgroundColor: COLORS.warningLight }]}>
                                <MaterialCommunityIcons name="alert" size={16} color={COLORS.warning} />
                            </View>
                            <Text style={styles.listText}>{weakness}</Text>
                        </View>
                    ))}
                </AnalysisCard>

                {/* Key Insights */}
                <AnalysisCard title="Key Insights" icon="lightbulb" iconColor={COLORS.primary}>
                    {analysis.key_insights.map((insight, index) => (
                        <View key={index} style={styles.listItem}>
                            <View style={[styles.listIcon, { backgroundColor: COLORS.primaryLight }]}>
                                <MaterialCommunityIcons name="star" size={16} color={COLORS.primary} />
                            </View>
                            <Text style={styles.listText}>{insight}</Text>
                        </View>
                    ))}
                </AnalysisCard>

                {/* Training Recommendations */}
                <AnalysisCard title="Training Plan" icon="school" iconColor={COLORS.accent}>
                    {analysis.training_recommendations.map((rec, index) => (
                        <View key={index} style={styles.recommendationCard}>
                            <View style={styles.recommendationHeader}>
                                <Text style={styles.recommendationArea}>{rec.area}</Text>
                                <View style={[
                                    styles.priorityBadge,
                                    { backgroundColor: getPriorityColor(rec.priority) + '20' }
                                ]}>
                                    <Text style={[
                                        styles.priorityText,
                                        { color: getPriorityColor(rec.priority) }
                                    ]}>
                                        {rec.priority.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.drillName}>🎯 {rec.drill}</Text>
                            <Text style={styles.drillDescription}>{rec.description}</Text>
                            <View style={styles.durationContainer}>
                                <MaterialCommunityIcons name="clock" size={14} color={COLORS.textSecondary} />
                                <Text style={styles.durationText}>{rec.duration}</Text>
                            </View>
                        </View>
                    ))}
                </AnalysisCard>

                {/* Next Match Strategy */}
                <AnalysisCard title="Next Match Strategy" icon="strategy" iconColor={COLORS.primary}>
                    <Text style={styles.strategyText}>{analysis.next_match_strategy}</Text>
                </AnalysisCard>

                {/* Retry Button */}
                <View style={styles.retryContainer}>
                    <ModernButton
                        title="Refresh Analysis"
                        onPress={loadAnalysis}
                        variant="outline"
                        icon="refresh"
                        fullWidth
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: SPACING.huge,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    loadingText: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginTop: SPACING.lg,
    },
    loadingSubtext: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    errorTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginTop: SPACING.lg,
    },
    errorMessage: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    overallCard: {
        marginBottom: SPACING.lg,
    },
    overallHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    overallLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    opponentName: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginTop: 4,
    },
    summary: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        lineHeight: TYPOGRAPHY.fontSize.md * 1.5,
    },
    statsCard: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    performanceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -SPACING.xs,
        marginBottom: SPACING.md,
    },
    performanceHeader: {
        marginBottom: SPACING.sm,
    },
    performanceNotes: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    listIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    listText: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text,
        lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
        paddingTop: 4,
    },
    recommendationCard: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    recommendationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    recommendationArea: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        flex: 1,
    },
    priorityBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.pill,
    },
    priorityText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        letterSpacing: 0.5,
    },
    drillName: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
        marginBottom: SPACING.xs,
    },
    drillDescription: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
        marginBottom: SPACING.sm,
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    durationText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
        marginLeft: SPACING.xs,
    },
    strategyText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.text,
        lineHeight: TYPOGRAPHY.fontSize.md * 1.6,
    },
    retryContainer: {
        marginTop: SPACING.lg,
    },
});