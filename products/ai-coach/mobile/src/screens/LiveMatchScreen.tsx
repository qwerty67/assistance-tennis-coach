import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { AppCard, LoadingScreen } from '../components/common';
import { ScoreBoard, FinalStrokeForm } from '../components/match';
import { matchService } from '../services/matchService';
import { Match, Point } from '../types';
import { COLORS } from '../utils/constants';
import { PointRecordingEngine, RecordingPhase } from '../utils/pointRecordingEngine';
import { ScoringEngine } from '../utils/scoringEngine';
import { useToast } from '../context/ToastContext';
import { ConfirmationDialog, ActionSheet } from '../components/common';
import { CustomHeader } from '../components/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { studentService } from '../services/studentService';
import { useTheme } from '../context/ThemeContext';
import { colors as dsColors, palette, radius, spacing } from '@tennis-platform/design-system';

interface LiveMatchScreenProps {
    route: any;
    navigation: any;
}

export default function LiveMatchScreen({ route, navigation }: LiveMatchScreenProps) {
    const { matchId } = route.params;
    const [match, setMatch] = useState<Match | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const [studentName, setStudentName] = useState<string>('شاگرد');
    
    // Engines
    const [pointEngine] = useState(() => new PointRecordingEngine());
    const [scoringEngine] = useState(() => new ScoringEngine());
    const [endMatchDialogVisible, setEndMatchDialogVisible] = useState(false);
    const [undoDialogVisible, setUndoDialogVisible] = useState(false);
    const [moreActionsVisible, setMoreActionsVisible] = useState(false);
    
    // UI State
    const [currentPhase, setCurrentPhase] = useState<RecordingPhase>('idle');
    const [, forceUpdate] = useState({});
    const { colors } = useTheme();

    useEffect(() => {
        loadMatchData();
    }, [matchId]);

    const loadMatchData = async () => {
        try {
            setLoading(true);
            const rawMatch: any = await matchService.getById(matchId);
            const resolvedMatch: Match = rawMatch?.data ?? rawMatch;
            setMatch(resolvedMatch);

            const studentId = resolvedMatch?.student_id ?? rawMatch?.student_id;
            if (studentId) {
                try {
                    const rawStudent: any = await studentService.getById(studentId);
                    const resolvedStudent = rawStudent?.data ?? rawStudent;
                    const resolvedName =
                        resolvedStudent?.name ||
                        `${resolvedStudent?.first_name || ''} ${resolvedStudent?.last_name || ''}`.trim() ||
                        'شاگرد';
                    setStudentName(resolvedName);
                } catch (e) {
                    console.warn('Could not load student name:', e);
                }
            }

            const pointsData = await matchService.getPoints(matchId);
            const resolvedPoints = Array.isArray(pointsData) ? pointsData : (pointsData as any)?.data ?? [];
            setPoints(resolvedPoints);

            // Reconstruct scoring state
            reconstructScoringState(resolvedPoints);

            // Initialize point engine with current server
            const currentServer = scoringEngine.getState().server || 'student';
            pointEngine.startPoint(currentServer);
            setCurrentPhase(pointEngine.getCurrentPhase());
        } catch (error) {
            console.error('Error loading match:', error);
            toast.error('خطا در دریافت اطلاعات مسابقه');
        } finally {
            setLoading(false);
        }
    };

    const reconstructScoringState = (pointsData: Point[]) => {
        const engine = new ScoringEngine();

        if (pointsData && pointsData.length > 0) {
            for (const point of pointsData) {
                if (point.point_winner) {
                    engine.addPoint(point.point_winner);
                }
            }
        }
        scoringEngine.setState(engine.getState());
    };

    // ============================================
    // ACTION HANDLERS
    // ============================================

    const handleAction = async (actionId: string) => {
        // Let - replay serve
        if (actionId === 'let') {
            toast.info('نت (Let) - تکرار سرویس');
            return;
        }

        // Perform action in engine
        const success = pointEngine.performAction(actionId);

        if (!success) {
            toast.error('عملیات نامعتبر است');
            return;
        }

        // Check if point is complete
        if (pointEngine.isPointComplete()) {
            await savePoint();
        } else {
            setCurrentPhase(pointEngine.getCurrentPhase());
            forceUpdate({});
        }
    };

    const handleFinalStroke = async (data: {
        player: 'student' | 'opponent';
        type: string;
        direction: string;
        result: 'winner' | 'forced_error' | 'unforced_error' | 'net';
    }) => {
        const success = pointEngine.setFinalStroke(data);

        if (!success) {
            toast.error('خطا در ثبت رویداد ضربه پایانی');
            return;
        }

        await savePoint();
    };

    const savePoint = async () => {
        try {
            const rawPointData = pointEngine.toPointCreate(
                matchId,
                points.length + 1,
                scoringEngine.getState().currentSet,
                scoringEngine.getState().currentGame,
                scoringEngine.getGameScoreDisplay()
            );

            if (!rawPointData) {
                toast.error('اطلاعات امتیاز برای ذخیره کامل نیست');
                return;
            }

            // Remove null or undefined fields for clean Pydantic compatibility
            const cleanPointData = Object.fromEntries(
                Object.entries(rawPointData).filter(([_, value]) => value !== undefined && value !== null)
            );

            await matchService.createPoint(matchId, cleanPointData as any);

            const winner = pointEngine.getPointWinner();
            if (winner) {
                scoringEngine.addPoint(winner);
            }

            pointEngine.reset();
            const nextServer = scoringEngine.getState().server || 'student';
            pointEngine.startPoint(nextServer);
            setCurrentPhase(pointEngine.getCurrentPhase());
            forceUpdate({});
            
            toast.success('امتیاز ثبت شد');
            await loadMatchData();
        } catch (error: any) {
            console.error('POINT SAVE FAILED:', error);
            const detail = error?.response?.data?.detail;
            let errorMsg = 'خطا در ثبت امتیاز در سرور';
            if (Array.isArray(detail)) {
                errorMsg = `خطا در فیلد: ${detail[0]?.loc?.join('.') || 'نامشخص'} - ${detail[0]?.msg || ''}`;
            } else if (typeof detail === 'string') {
                errorMsg = detail;
            }
            toast.error(errorMsg);
        }
    };

    const handleUndo = () => {
        if (points.length === 0) {
            toast.info('امتیازی برای لغو وجود ندارد');
            return;
        }
        setUndoDialogVisible(true);
    };

    const handleUndoConfirm = async () => {
        try {
            const lastPoint = points[points.length - 1];
            await matchService.deletePoint(matchId, lastPoint.id);
            toast.success('آخرین امتیاز با موفقیت لغو شد');
            await loadMatchData();
        } catch (error) {
            console.error('Error undoing point:', error);
            toast.error('خطا در لغو امتیاز');
        } finally {
            setUndoDialogVisible(false);
        }
    };

    const confirmEndMatch = async (result: 'win' | 'loss') => {
        try {
            const setsScore = scoringEngine.getMatchScoreDisplay();
            await matchService.complete(matchId, {
                sets_score: setsScore,
                final_result: result,
            });

            toast.success('مسابقه با موفقیت پایان یافت');
            setEndMatchDialogVisible(false);

            setTimeout(() => {
                navigation.goBack();
            }, 800);
        } catch (error) {
            console.error('Error completing match:', error);
            toast.error('خطا در ثبت پایان مسابقه');
        }
    };

    const handleEndMatch = () => {
        setEndMatchDialogVisible(true);
    };

    if (loading || !match) {
        return <LoadingScreen message="در حال دریافت اطلاعات مسابقه..." />;
    }

    const availableActions = pointEngine.getAvailableActions();
    const serverName = pointEngine.getServerName(studentName, match.opponent_name);

    return (
        <View style={[styles.container, { backgroundColor: colors.background, direction: 'rtl' }]}>
            <CustomHeader
                title="ثبت رویداد زنده مسابقه"
                subtitle={`حریف: ${match.opponent_name}`}
                onBack={() => navigation.goBack()}
                rightAction={{
                    icon: 'dots-vertical',
                    onPress: () => setMoreActionsVisible(true),
                }}
            />
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Score Board */}
                <ScoreBoard
                    scoreState={scoringEngine.getState()}
                    studentName={`${studentName} (شاگرد)`}
                    opponentName={match.opponent_name}
                />

                {/* Current Phase Card */}
                <AppCard style={styles.card}>
                    <View style={styles.phaseHeaderRow}>
                        <View style={styles.phaseBadge}>
                            <MaterialCommunityIcons name="tennis" size={18} color={palette.lime400} />
                            <Text style={styles.phaseBadgeText}>
                                {pointEngine.getPhaseDisplayText()}
                            </Text>
                        </View>
                        <Text style={[styles.serverText, { color: colors.textSecondary }]}>
                            زننده سرویس: <Text style={{ fontWeight: 'bold', color: colors.text }}>{serverName}</Text>
                        </Text>
                    </View>

                    {/* Quick jump to Final Stroke / Rally */}
                    {currentPhase !== 'final_stroke' && (
                        <TouchableOpacity
                            onPress={() => {
                                pointEngine.startFinalStroke(currentPhase === 'second_serve' ? 'second' : 'first');
                                setCurrentPhase('final_stroke');
                                forceUpdate({});
                            }}
                            style={styles.quickRallyButton}
                        >
                            <MaterialCommunityIcons name="flash" size={16} color={palette.navy900} />
                            <Text style={styles.quickRallyText}>
                                ثبت مستقیم ضربه نهایی رالی (تکنیک / تاکتیک)
                            </Text>
                        </TouchableOpacity>
                    )}
                </AppCard>

                {/* Dynamic Action Buttons (Serve & Return) */}
                {(currentPhase === 'first_serve' || currentPhase === 'second_serve' || currentPhase === 'return') && (
                    <AppCard style={styles.card}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {currentPhase === 'return' ? 'نتیجه دریافت سرویس (Return):' : 'نتیجه سرویس:'}
                        </Text>
                        <View style={styles.buttonGrid}>
                            {availableActions.map((action) => (
                                <Button
                                    key={action.id}
                                    mode="contained"
                                    onPress={() => handleAction(action.id)}
                                    style={[
                                        styles.actionButton,
                                        action.category === 'success' && styles.successButton,
                                        action.category === 'warning' && styles.warningButton,
                                        action.category === 'error' && styles.errorButton,
                                        action.category === 'neutral' && styles.neutralButton,
                                    ]}
                                    labelStyle={styles.actionButtonLabel}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </View>
                    </AppCard>
                )}

                {/* Final Stroke Form (Technique, Tactic, State) */}
                {currentPhase === 'final_stroke' && (
                    <FinalStrokeForm
                        onSubmit={handleFinalStroke}
                        onCancel={() => {
                            pointEngine.reset();
                            const currentSrv = scoringEngine.getState().server || 'student';
                            pointEngine.startPoint(currentSrv);
                            setCurrentPhase(pointEngine.getCurrentPhase());
                            forceUpdate({});
                        }}
                        studentName={studentName}
                        opponentName={match.opponent_name}
                    />
                )}

                {/* Control Buttons */}
                <View style={styles.controlButtons}>
                    <Button
                        mode="outlined"
                        onPress={handleUndo}
                        style={styles.controlButton}
                        icon="undo"
                        labelStyle={styles.controlButtonText}
                    >
                        لغو امتیاز (Undo)
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleEndMatch}
                        style={[styles.controlButton, styles.endButton]}
                        icon="flag-checkered"
                        labelStyle={styles.controlButtonText}
                    >
                        اتمام بازی
                    </Button>
                </View>

                {/* Points Summary / History */}
                <AppCard style={styles.timelineCard}>
                    <View style={styles.timelineHeader}>
                        <MaterialCommunityIcons name="history" size={20} color={palette.navy800} />
                        <Text style={[styles.timelineTitle, { color: colors.text }]}>
                            امتیازات و رویدادهای اخیر
                        </Text>
                    </View>

                    {points.length === 0 ? (
                        <View style={styles.emptyTimeline}>
                            <MaterialCommunityIcons name="tennis-ball" size={36} color={colors.textSecondary || '#999'} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                هنوز امتیازی برای این مسابقه ثبت نشده است.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.timelineList}>
                            {points.slice(-8).reverse().map((point, index, arr) => {
                                const isStudentWinner = point.point_winner === 'student';
                                return (
                                    <View key={point.id || index} style={styles.timelineItem}>
                                        {index < arr.length - 1 && <View style={styles.timelineLine} />}

                                        <View style={[
                                            styles.timelineDot,
                                            { backgroundColor: isStudentWinner ? '#2E7D32' : '#C62828' }
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={isStudentWinner ? 'check' : 'close'}
                                                size={16}
                                                color="#FFF"
                                            />
                                        </View>

                                        <View style={styles.timelineContent}>
                                            <Text style={[
                                                styles.timelineWinner,
                                                { color: isStudentWinner ? '#2E7D32' : '#C62828' }
                                            ]}>
                                                {isStudentWinner ? `امتیاز: ${studentName}` : `امتیاز: ${match.opponent_name}`}
                                            </Text>
                                            <Text style={styles.timelineScore}>
                                                نتیجه گیم: {point.game_score}
                                                {point.final_stroke_type ? ` • تکنیک: ${point.final_stroke_type}` : ''}
                                                {point.serve_result === 'ace' ? ' • ایس' : ''}
                                                {point.serve_result === 'double_fault' ? ' • دوبل فالت' : ''}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </AppCard>
            </ScrollView>

            {/* End Match Confirmation Dialog */}
            <ConfirmationDialog
                visible={endMatchDialogVisible}
                title="اتمام مسابقه"
                message="آیا مطمئن هستید که مسابقه به پایان رسیده است؟ برنده این مسابقه چه کسی است؟"
                icon="flag-checkered"
                iconColor={COLORS.warning}
                onDismiss={() => setEndMatchDialogVisible(false)}
                actions={[
                    {
                        label: 'انصراف',
                        onPress: () => setEndMatchDialogVisible(false),
                        variant: 'cancel',
                    },
                    {
                        label: 'برد حریف',
                        onPress: () => confirmEndMatch('loss'),
                        variant: 'destructive',
                        icon: 'account',
                    },
                    {
                        label: 'برد شاگرد',
                        onPress: () => confirmEndMatch('win'),
                        variant: 'primary',
                        icon: 'trophy',
                    },
                ]}
            />

            {/* Undo Dialog */}
            <ConfirmationDialog
                visible={undoDialogVisible}
                title="لغو آخرین امتیاز"
                message="آیا مطمئن هستید که می‌خواهید آخرین امتیاز ثبت‌شده را حذف کنید؟ این عملیات قابل بازگشت نیست."
                icon="undo"
                iconColor={COLORS.warning}
                onDismiss={() => setUndoDialogVisible(false)}
                actions={[
                    {
                        label: 'انصراف',
                        onPress: () => setUndoDialogVisible(false),
                        variant: 'cancel',
                    },
                    {
                        label: 'حذف و لغو امتیاز',
                        onPress: handleUndoConfirm,
                        variant: 'destructive',
                        icon: 'undo',
                    },
                ]}
            />

            {/* More Actions ActionSheet */}
            <ActionSheet
                visible={moreActionsVisible}
                title="عملیات مسابقه"
                onDismiss={() => setMoreActionsVisible(false)}
                items={[
                    {
                        label: 'لغو آخرین امتیاز (Undo)',
                        icon: 'undo',
                        onPress: handleUndo,
                    },
                    {
                        label: 'اتمام مسابقه',
                        icon: 'flag-checkered',
                        onPress: () => setEndMatchDialogVisible(true),
                    },
                    {
                        label: 'خروج از ثبت زنده',
                        icon: 'close-circle',
                        onPress: () => {
                            navigation.goBack();
                        },
                        destructive: true,
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        padding: spacing.md,
    },
    card: {
        marginBottom: spacing.md,
        borderRadius: radius.lg,
    },
    phaseHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    phaseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.navy900,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.pill,
        gap: 6,
    },
    phaseBadgeText: {
        color: '#FFFFFF',
        fontFamily: 'Vazirmatn_700Bold',
        fontSize: 13,
    },
    serverText: {
        fontFamily: 'Vazirmatn_500Medium',
        fontSize: 13,
    },
    quickRallyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.lime200,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: radius.md,
        marginTop: 10,
        gap: 6,
    },
    quickRallyText: {
        color: palette.navy900,
        fontFamily: 'Vazirmatn_700Bold',
        fontSize: 12,
    },
    sectionTitle: {
        fontFamily: 'Vazirmatn_700Bold',
        fontSize: 14,
        textAlign: 'right',
        marginBottom: 10,
    },
    buttonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        minWidth: '46%',
        borderRadius: radius.md,
    },
    actionButtonLabel: {
        fontFamily: 'Vazirmatn_700Bold',
        fontSize: 13,
    },
    successButton: {
        backgroundColor: '#2E7D32',
    },
    warningButton: {
        backgroundColor: '#E65100',
    },
    errorButton: {
        backgroundColor: '#C62828',
    },
    neutralButton: {
        backgroundColor: palette.navy800,
    },
    controlButtons: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: spacing.md,
    },
    controlButton: {
        flex: 1,
        borderRadius: radius.md,
    },
    controlButtonText: {
        fontFamily: 'Vazirmatn_700Bold',
        fontSize: 13,
    },
    endButton: {
        backgroundColor: '#C62828',
    },
    timelineCard: {
        marginBottom: 32,
        padding: spacing.md,
        borderRadius: radius.lg,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: dsColors.border,
    },
    timelineTitle: {
        fontSize: 15,
        fontFamily: 'Vazirmatn_700Bold',
    },
    emptyTimeline: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    emptyText: {
        fontSize: 13,
        fontFamily: 'Vazirmatn_400Regular',
    },
    timelineList: {
        paddingRight: 6,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        right: 15,
        top: 28,
        bottom: -18,
        width: 2,
        backgroundColor: dsColors.border,
    },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    timelineContent: {
        flex: 1,
        marginRight: 12,
        alignItems: 'flex-start',
    },
    timelineWinner: {
        fontSize: 14,
        fontFamily: 'Vazirmatn_700Bold',
    },
    timelineScore: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Vazirmatn_400Regular',
        marginTop: 2,
    },
});
