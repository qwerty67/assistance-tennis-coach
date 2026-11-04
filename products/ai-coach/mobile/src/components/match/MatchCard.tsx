import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    AppText,
    Avatar,
    Badge,
    Button,
    Card,
} from '@tennis-platform/design-system';
import { colors, palette, radius, spacing } from '@tennis-platform/design-system';
import { digits, formatDate } from '@tennis-platform/shared-utils';
import { Match } from '../../types';

interface MatchCardProps {
    match: Match;
    navigation: any;
    index?: number;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, navigation, index }) => {
    const isOngoing = match.status === 'ongoing';
    const isCompleted = match.status === 'completed';
    const isWin = match.final_result === 'win';

    const statusLabel = isOngoing ? 'در جریان' : isWin ? 'برد' : 'باخت';
    const statusColor = isOngoing ? palette.amber500 : isWin ? palette.green600 : palette.red500;
    const statusBg = isOngoing ? palette.amber100 : isWin ? palette.green100 : palette.red100;

    return (
        <Card index={index}>
            <View style={styles.container}>
                {/* Header row */}
                <View style={styles.header}>
                    <Avatar name={match.opponent_name || 'حریف'} size={44} />
                    <View style={styles.info}>
                        <AppText variant="h3" numberOfLines={1}>
                            {`رقابت با ${match.opponent_name}`}
                        </AppText>
                        <View style={styles.metaRow}>
                            <MaterialCommunityIcons name="calendar-clock" size={13} color={colors.textMuted} />
                            <AppText variant="caption" muted>
                                {match.match_date ? formatDate(match.match_date) : 'مسابقه تنیس'}
                            </AppText>
                            {match.location ? (
                                <AppText variant="caption" muted>
                                    {`· ${match.location}`}
                                </AppText>
                            ) : null}
                        </View>
                    </View>
                    <Badge label={statusLabel} color={statusColor} bg={statusBg} />
                </View>

                {/* Score section */}
                {match.sets_score && (
                    <View style={styles.scoreRow}>
                        <AppText variant="small" muted>نتیجه ست‌ها:</AppText>
                        <AppText variant="bodyMedium" style={{ fontWeight: '700', letterSpacing: 1 }}>
                            {match.sets_score}
                        </AppText>
                    </View>
                )}

                {/* Actions row */}
                <View style={styles.actionRow}>
                    {isOngoing ? (
                        <Button
                            title="ادامه ثبت امتیازات"
                            onPress={() => navigation.navigate('LiveMatch', { matchId: match.id })}
                            variant="primary"
                            icon="record-rec"
                            size="sm"
                            fullWidth
                        />
                    ) : (
                        <View style={styles.completedActions}>
                            <View style={{ flex: 1 }}>
                                <Button
                                    title="مشاهده جزئیات"
                                    onPress={() => navigation.navigate('MatchDetails', { matchId: match.id })}
                                    variant="outline"
                                    size="sm"
                                    fullWidth
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Button
                                    title="تحلیل هوشمند AI"
                                    onPress={() => navigation.navigate('AIAnalysis', { matchId: match.id })}
                                    variant="navy"
                                    icon="robot-outline"
                                    size="sm"
                                    fullWidth
                                />
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    info: {
        flex: 1,
        gap: 3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
    },
    actionRow: {
        marginTop: 2,
    },
    completedActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
});

export default MatchCard;
