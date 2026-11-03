import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppCard } from '../common';
import { ScoreState, ScoringService } from '../../utils/scoringService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import {useTheme} from "../../context/ThemeContext";

interface ScoreBoardProps {
    scoreState: ScoreState;
    studentName?: string;
    opponentName?: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
                                                          scoreState,
                                                          studentName = 'Student',
                                                          opponentName = 'Opponent'
                                                      }) => {
    const gameScore = ScoringService.getGameScoreDisplay(scoreState);
    const matchScore = ScoringService.getMatchScoreDisplay(scoreState);
    const currentSetScore = ScoringService.getCurrentSetScore(scoreState);
    const { colors } = useTheme();

    return (
        <AppCard style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialCommunityIcons name="tennis" size={20} color={COLORS.primary} />
                    <Text style={styles.headerLabel}>Match Score</Text>
                </View>
                <Text style={styles.matchScore}>{matchScore}</Text>
            </View>

            {/* Players */}
            <View style={styles.playersContainer}>
                <View style={styles.playerRow}>
                    <View style={styles.playerInfo}>
                        {scoreState.server === 'student' && (
                            <View style={styles.serverBadge}>
                                <MaterialCommunityIcons name="tennis-ball" size={12} color={colors.text} />
                            </View>
                        )}
                        <Text style={[styles.playerName,{color:colors.text}]}>{studentName}</Text>
                    </View>
                    <View style={styles.scoreContainer}>
                        <Text style={[styles.setScore,{color:colors.text}]}>{currentSetScore.student}</Text>
                        <Text style={styles.pointScore}>
                            {ScoringService.getPointDisplay().student}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.playerRow}>
                    <View style={styles.playerInfo}>
                        {scoreState.server === 'opponent' && (
                            <View style={styles.serverBadge}>
                                <MaterialCommunityIcons name="tennis-ball" size={12} color={COLORS.tennisBall} />
                            </View>
                        )}
                        <Text style={[styles.playerName,{color:colors.text}]}>{opponentName}</Text>
                    </View>
                    <View style={styles.scoreContainer}>
                        <Text style={[styles.setScore,{color:colors.text}]}>{currentSetScore.opponent}</Text>
                        <Text style={styles.pointScore}>
                            {ScoringService.getPointDisplay().opponent}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer,{backgroundColor:colors.background}]}>
                <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>Set</Text>
                    <Text style={[styles.footerValue,{color:colors.text}]}>{scoreState.currentSet}</Text>
                </View>
                <View style={styles.footerDivider} />
                <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>Game</Text>
                    <Text style={[styles.footerValue,{color:colors.text}]}>{scoreState.currentGame}</Text>
                </View>
                <View style={styles.footerDivider} />
                <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>Current</Text>
                    <Text style={[styles.footerValue,{color:colors.text}]}>{gameScore}</Text>
                </View>
            </View>
        </AppCard>
    );
};

const styles = StyleSheet.create({
    card: { marginBottom: SPACING.lg },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    headerLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textSecondary,
        marginLeft: SPACING.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    matchScore: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    playersContainer: { marginBottom: SPACING.lg },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    playerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    serverBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.tennisBall + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    playerName: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        // color: COLORS.text,
    },
    scoreContainer: { flexDirection: 'row', alignItems: 'center' },
    setScore: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        minWidth: 40,
        textAlign: 'center',
    },
    pointScore: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
        minWidth: 60,
        textAlign: 'center',
        marginLeft: SPACING.md,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.xs,
    },
    footer: {
        flexDirection: 'row',
        // backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
    },
    footerItem: { flex: 1, alignItems: 'center' },
    footerLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    footerValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginTop: 2,
    },
    footerDivider: {
        width: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.xs,
    },
});