import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Dialog, Portal } from 'react-native-paper';
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
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {studentService} from "../services/studentService";
import {useTheme} from "../context/ThemeContext";

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
    const [studentName, setStudentName] = useState<string>('Student');
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
            const matchData = await matchService.getById(matchId);
            setMatch(matchData);
            console.log("matchData",matchData.data.student_id)
            try {
                const studentData = await studentService.getById(matchData?.data?.student_id);
                setStudentName(studentData.data.name || 'Student');
            } catch (e) {
                console.log(e);
            }
            const pointsData = await matchService.getPoints(matchId);
            setPoints(pointsData);

            // Reconstruct scoring state
            reconstructScoringState(pointsData);

            // Start first point
            pointEngine.startPoint(scoringEngine.getState().server);
            setCurrentPhase(pointEngine.getCurrentPhase());
        } catch (error) {
            console.error('Error loading match:', error);
        } finally {
            setLoading(false);
        }
    };

    const reconstructScoringState = (pointsData: Point[]) => {
        const engine = new ScoringEngine();

        // اگر هیچ امتیازی ثبت نشده، مطمئن می‌شویم که state کاملاً ریست است
        if (pointsData.length === 0) {
            // فرض بر این است که ScoringEngine در حالت پیش‌فرض ۰-۰ است.
            // اگر متد reset دارد، آن را صدا بزنید: engine.reset();
        } else {
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
        // Let - just show message, don't change state
        if (actionId === 'let') {
            toast.info('Let - Serve will be replayed');
            // Alert.alert('Let', 'Serve will be replayed');
            return;
        }

        // Perform action in engine
        const success = pointEngine.performAction(actionId);

        if (!success) {
            toast.error('Invalid action');
            // Alert.alert('Error', 'Invalid action');
            return;
        }

        // Check if point is complete
        if (pointEngine.isPointComplete()) {
            await savePoint();
        } else {
            // Update UI phase
            setCurrentPhase(pointEngine.getCurrentPhase());
            forceUpdate({}); // Force re-render
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
            toast.error('Failed to record final stroke');
            // Alert.alert('Error', 'Failed to record final stroke');
            return;
        }

        await savePoint();
    };

    const savePoint = async () => {
        try {
            // ۱. دریافت داده خام از انجین
            const rawPointData = pointEngine.toPointCreate(
                matchId,
                points.length + 1,
                scoringEngine.getState().currentSet,
                scoringEngine.getState().currentGame,
                scoringEngine.getGameScoreDisplay()
            );

            console.log("🔴 RAW Data from Engine:", JSON.stringify(rawPointData, null, 2));

            // ۲. تمیزکاری داده‌ها (حذف undefined و null)
            // Pydantic V2 با فیلدهایی که مقدارشان undefined است، خطای 422 می‌دهد
            const cleanPointData = Object.fromEntries(
                Object.entries(rawPointData).filter(([_, value]) => value !== undefined && value !== null)
            );

            console.log("🟢 CLEAN Data to Send:", JSON.stringify(cleanPointData, null, 2));

            // ۳. ارسال درخواست
            await matchService.createPoint(matchId, cleanPointData);

            // ... (بقیه کد موفقیت‌آمیز: update scoring, reset, loadMatchData) ...
            const winner = pointEngine.getPointWinner();
            if (winner) {
                scoringEngine.addPoint(winner);
            }
            pointEngine.reset();
            pointEngine.startPoint(scoringEngine.getState().server);
            setCurrentPhase(pointEngine.getCurrentPhase());
            forceUpdate({});
            await loadMatchData();

        } catch (error: any) {
            // ۴. چاپ فوق‌العاده دقیق خطا
            console.error("========================================");
            console.error("🚨🚨🚨 POINT SAVE FAILED 🚨🚨🚨");
            console.error("========================================");

            if (error.response) {
                console.error("Status Code:", error.response.status);
                console.error("Response Data (The Pydantic Error):", JSON.stringify(error.response.data, null, 2));

                // استخراج پیام خطای خوانا برای Toast
                const detail = error.response.data?.detail;
                let errorMsg = "خطای نامشخص در ذخیره امتیاز";

                if (Array.isArray(detail)) {
                    // اگر خطا آرایه‌ای از فیلدهای نامعتبر باشد
                    errorMsg = `خطا در فیلد: ${detail[0]?.loc?.join('.') || 'نامشخص'} - ${detail[0]?.msg || ''}`;
                } else if (typeof detail === 'string') {
                    errorMsg = detail;
                }

                toast.error(errorMsg);
            } else {
                console.error("Network or Other Error:", error.message);
                toast.error("خطای شبکه یا سرور");
            }
            console.error("========================================");
        }
    };

    const handleUndo = () => {
        if (points.length === 0) {
            toast.info('No points to undo');
            return;
        }
        setUndoDialogVisible(true);
    };

    const handleUndoConfirm = async () => {
        try {
            const lastPoint = points[points.length - 1];
            await matchService.deletePoint(matchId, lastPoint.id);
            toast.success('Point undone');
            await loadMatchData();
        } catch (error) {
            console.error('Error undoing point:', error);
            toast.error('Failed to undo point');
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

            toast.success('Match completed!');
            setEndMatchDialogVisible(false);

            // کمی تاخیر برای نمایش toast قبل از navigation
            setTimeout(() => {
                navigation.goBack();
            }, 1000);
        } catch (error) {
            console.error('Error completing match:', error);
            toast.error('Failed to complete match');
        }
    };

    const handleEndMatch = () => {
        setEndMatchDialogVisible(true);
    };

    if (loading || !match) {
        return <LoadingScreen />;
    }

    // Get available actions from engine
    const availableActions = pointEngine.getAvailableActions();
    const currentState = pointEngine.getState();

    return (
        <View style={[styles.container,{backgroundColor:colors.background}]}>
            <CustomHeader
                title="Live Match"
                subtitle={match.opponent_name}
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
                    studentName={`${studentName} (Student)`}  // ✅ تغییر
                    opponentName={match.opponent_name}
                />

            {/* Current Phase Display */}
                <AppCard style={styles.card}>
                    <Text style={[styles.phaseTitle,{color:colors.text}]}>
                        {pointEngine.getPhaseDisplayText()}
                    </Text>
                    <Text style={styles.phaseSubtitle}>
                        Server: {pointEngine.getServerName(`${studentName}`, match.opponent_name)}
                    </Text>
                </AppCard>

            {/* Dynamic Action Buttons (Serve & Return) */}
                {(currentPhase === 'first_serve' || currentPhase === 'second_serve' || currentPhase === 'return') && (
                    <AppCard style={styles.card}>
                        <View style={styles.buttonGroup}>
                            {availableActions.map((action) => (
                                <Button
                                    key={action.id}
                                    mode="contained"
                                    onPress={() => handleAction(action.id)}
                                    style={[
                                        styles.button,
                                        action.category === 'success' && styles.successButton,
                                        action.category === 'warning' && styles.warningButton,
                                        action.category === 'error' && styles.errorButton,
                                    ]}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </View>
                    </AppCard>
                )}

            {/* Final Stroke Form */}
                {currentPhase === 'final_stroke' && (
                    <FinalStrokeForm
                        onSubmit={handleFinalStroke}
                        onCancel={() => {
                            pointEngine.reset();
                            pointEngine.startPoint(scoringEngine.getState().server);
                            setCurrentPhase(pointEngine.getCurrentPhase());
                            // forceUpdate({});
                        }}
                        studentName={`${studentName} (Student)`}  // ✅ تغییر
                        opponentName={match.opponent_name}
                    />
                )}

            {/* Control Buttons */}
                <View style={styles.controlButtons}>
                    <Button mode="outlined" onPress={handleUndo} style={styles.controlButton} icon="undo">
                        Undo
                    </Button>
                    <Button mode="contained" onPress={handleEndMatch} style={[styles.controlButton, styles.endButton]} icon="flag-checkered">
                        End Match
                    </Button>
                </View>

            {/* Points Summary */}
                <AppCard style={styles.timelineCard}>
                    <View style={styles.timelineHeader}>
                        <MaterialCommunityIcons name="history" size={20} color={COLORS.primary} />
                        <Text style={[styles.timelineTitle,{color:colors.text}]}>Recent Points</Text>
                    </View>

                    {points.length === 0 ? (
                        <View style={styles.emptyTimeline}>
                            <MaterialCommunityIcons name="tennis-ball" size={32} color={COLORS.textTertiary || '#999'} />
                            <Text style={styles.emptyText}>No points recorded yet</Text>
                        </View>
                    ) : (
                        <View style={styles.timelineList}>
                            {points.slice(-5).reverse().map((point, index, arr) => (
                                <View key={point.id} style={styles.timelineItem}>
                                    {/* خط عمودی اتصال دهنده */}
                                    {index < arr.length - 1 && (
                                        <View style={styles.timelineLine} />
                                    )}

                                    {/* دایره وضعیت */}
                                    <View style={[
                                        styles.timelineDot,
                                        { backgroundColor: point.point_winner === 'student' ? COLORS.success : COLORS.error }
                                    ]}>
                                        <MaterialCommunityIcons
                                            name={point.point_winner === 'student' ? 'check' : 'close'}
                                            size={16}
                                            color="#FFF"
                                        />
                                    </View>

                                    {/* محتوای امتیاز */}
                                    <View style={styles.timelineContent}>
                                        <Text style={[
                                            styles.timelineWinner,
                                            { color: point.point_winner === 'student' ? COLORS.success : COLORS.error }
                                        ]}>
                                            {point.point_winner === 'student' ? 'Student Point' : 'Opponent Point'}
                                        </Text>
                                        <Text style={styles.timelineScore}>
                                            Game Score: {point.game_score}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </AppCard>

            {/* End Match Dialog */}
            <Portal>
                <Dialog visible={endMatchDialogVisible} onDismiss={() => setEndMatchDialogVisible(false)}>
                    <Dialog.Title>End Match</Dialog.Title>
                    <Dialog.Content>
                        <Text>Who won the match?</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setEndMatchDialogVisible(false)}>Cancel</Button>
                        <Button onPress={() => confirmEndMatch('loss')} textColor={COLORS.error}>
                            Opponent
                        </Button>
                        <Button onPress={() => confirmEndMatch('win')} textColor={COLORS.success}>
                            Student
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
            {/* End Match Dialog */}
            <ConfirmationDialog
                visible={endMatchDialogVisible}
                title="End Match"
                message="Are you sure you want to end this match? You won't be able to add more points."
                icon="flag-checkered"
                iconColor={COLORS.warning}
                onDismiss={() => setEndMatchDialogVisible(false)}
                actions={[
                    {
                        label: 'Cancel',
                        onPress: () => setEndMatchDialogVisible(false),
                        variant: 'cancel',
                    },
                    {
                        label: 'Opponent Won',
                        onPress: () => confirmEndMatch('loss'),
                        variant: 'destructive',
                        icon: 'account',
                    },
                    {
                        label: 'You Won',
                        onPress: () => confirmEndMatch('win'),
                        variant: 'primary',
                        icon: 'trophy',
                    },
                ]}
            />
            {/* Undo Dialog */}
            <ConfirmationDialog
                visible={undoDialogVisible}
                title="Undo Last Point"
                message="Are you sure you want to delete the last point? This cannot be undone."
                icon="undo"
                iconColor={COLORS.warning}
                onDismiss={() => setUndoDialogVisible(false)}
                actions={[
                    {
                        label: 'Cancel',
                        onPress: () => setUndoDialogVisible(false),
                        variant: 'cancel',
                    },
                    {
                        label: 'Undo',
                        onPress: handleUndoConfirm,
                        variant: 'destructive',
                        icon: 'undo',
                    },
                ]}
            />
            {/* More Actions ActionSheet */}
            <ActionSheet
                visible={moreActionsVisible}
                title="Match Actions"
                onDismiss={() => setMoreActionsVisible(false)}
                items={[
                    {
                        label: 'Undo Last Point',
                        icon: 'undo',
                        onPress: handleUndo,
                    },
                    {
                        label: 'End Match',
                        icon: 'flag-checkered',
                        onPress: () => setEndMatchDialogVisible(true),
                    },
                    {
                        label: 'Cancel Match',
                        icon: 'close-circle',
                        onPress: () => {
                            toast.info('Match cancelled');
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
        // backgroundColor: COLORS.background,
        // padding: 16,
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 12,
    },
    phaseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        // color: COLORS.text,
    },
    phaseSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    button: {
        flex: 1,
        margin: 4,
        minWidth: '45%',
    },
    successButton: {
        backgroundColor: COLORS.success,
    },
    warningButton: {
        backgroundColor: COLORS.warning,
    },
    errorButton: {
        backgroundColor: COLORS.error,
    },
    controlButtons: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    controlButton: {
        flex: 1,
        margin: 4,
    },
    endButton: {
        backgroundColor: COLORS.error,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    pointSummary: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginVertical: 2,
    },
    timelineCard: {
        marginBottom: 12,
        padding: 16,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border || '#E0E0E0',
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: 8,
    },
    emptyTimeline: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    timelineList: {
        paddingLeft: 8, // فضا برای خط عمودی
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 15, // تنظیم دقیق برای وسط‌چین شدن با دایره
        top: 32,
        bottom: -20,
        width: 2,
        backgroundColor: COLORS.border || '#E0E0E0',
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
        marginLeft: 12,
        justifyContent: 'center',
    },
    timelineWinner: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    timelineScore: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
});