import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Match } from '../../types';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { ModernButton } from '../common';
import {useTheme} from "../../context/ThemeContext"; // استفاده از دکمه استاندارد پروژه

interface MatchCardProps {
    match: Match;
    navigation: any;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, navigation }) => {
    const isOngoing = match.status === 'ongoing';
    const isCompleted = match.status === 'completed';
    const { colors } = useTheme();

    const getStatusColor = () => {
        if (isOngoing) return COLORS.warning;
        if (isCompleted && match.final_result === 'win') return COLORS.success;
        if (isCompleted && match.final_result === 'loss') return COLORS.error;
        return COLORS.textSecondary;
    };

    const getStatusText = () => {
        if (isOngoing) return 'In Progress';
        if (isCompleted) return match.final_result === 'win' ? 'Won' : 'Lost';
        return 'Unknown';
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

    return (
        // ✅ تغییر از TouchableOpacity به View معمولی (کارت دیگر کلیکی نیست)
        <View style={[styles.card,{backgroundColor: colors.surface}]}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={[styles.opponentName,{color: colors.text}]}>vs {match.opponent_name}</Text>
                    <Text style={styles.date}>{formatPersianDate(match.match_date)}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                    <MaterialCommunityIcons
                        name={isOngoing ? 'clock-outline' : 'check-circle'}
                        size={14}
                        color={getStatusColor()}
                        style={styles.statusIcon}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>
                        {getStatusText()}
                    </Text>
                </View>
            </View>

            {match.sets_score && isCompleted && (
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Final Score:</Text>
                    <Text style={styles.scoreValue}>{match.sets_score}</Text>
                </View>
            )}

            {/* ✅ بخش دکمه‌های عملیاتی (فقط دکمه‌ها کلیک می‌شوند) */}
            <View style={styles.actionContainer}>
                {isOngoing ? (
                    <ModernButton
                        title="Continue Recording"
                        onPress={() => navigation.navigate('LiveMatch', { matchId: match.id })}
                        variant="primary"
                        icon="record-rec"
                        size="sm"
                        fullWidth
                    />
                ) : (
                    <ModernButton
                        title="View Details"
                        onPress={() => navigation.navigate('MatchDetails', { matchId: match.id })}
                        variant="outline"
                        icon="eye"
                        size="sm"
                        fullWidth
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        // backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    titleContainer: {
        flex: 1,
    },
    opponentName: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        // color: COLORS.text,
        marginBottom: 4,
    },
    date: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
    },
    statusIcon: {
        marginRight: 4,
    },
    statusText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    scoreLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginRight: SPACING.sm,
    },
    scoreValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
    },
    actionContainer: {
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
});