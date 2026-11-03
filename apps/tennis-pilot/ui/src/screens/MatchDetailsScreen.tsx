import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { AppCard, LoadingScreen } from '../components/common';
import { matchService } from '../services/matchService';
import { Match, Point } from '../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { CustomHeader } from '../components/common';
interface MatchDetailsScreenProps {
    route: any;
    navigation: any;
}
import { ModernButton } from '../components/common';
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useTheme} from "../context/ThemeContext";

const MatchDetailsScreen: React.FC<MatchDetailsScreenProps> = ({ route, navigation }) => {
    const { matchId } = route.params;
    const [match, setMatch] = useState<Match | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [loading, setLoading] = useState(true);
    const { colors } = useTheme();

    useEffect(() => {
        loadMatchData();
    }, [matchId]);

    const loadMatchData = async () => {
        try {
            setLoading(true);
            const matchData = await matchService.getById(matchId);
            setMatch(matchData?.data);

            const pointsData = await matchService.getPoints(matchId);
            setPoints(pointsData);
        } catch (error) {
            console.error('Error loading match:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !match) {
        return <LoadingScreen />;
    }

    return (
        <View style={[styles.container,{backgroundColor:colors.background}]}>
            <CustomHeader
                title="Match Details"
                subtitle={match.opponent_name}
                onBack={() => navigation.goBack()}
            />

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Match Info Card */}
                <AppCard style={styles.card}>
                    <Text style={[styles.title,{color: colors.text}]}>Match Information</Text>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="account" size={18} color={COLORS.textSecondary} />
                        <Text style={{color: colors.textSecondary}}>Opponent: {match.opponent_name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="calendar" size={18} color={COLORS.textSecondary} />
                        <Text style={{color: colors.textSecondary}}>Date: {match.match_date}</Text>
                    </View>
                    {match.location && (
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.textSecondary} />
                            <Text style={{color: colors.textSecondary}}>Location: {match.location}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="information" size={18} color={COLORS.textSecondary} />
                        <Text style={{color: colors.textSecondary}}>Status: {match.status}</Text>
                    </View>
                    {match.sets_score && (
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="trophy" size={18} color={COLORS.textSecondary} />
                            <Text style={{color: colors.textSecondary}}>Score: {match.sets_score}</Text>
                        </View>
                    )}
                </AppCard>

                {/* Points Card */}
                <AppCard style={styles.card}>
                    <Text style={[styles.title,{color: colors.text}]}>Points ({points.length})</Text>
                    {points.slice(0, 10).map((point) => (
                        <View key={point.id} style={styles.pointRow}>
                            <Text style={[styles.pointNumber,{color: colors.primary}]}>#{point.point_number}</Text>
                            <Text style={[styles.pointScore,{color: colors.text}]}>{point.game_score}</Text>
                            <Text style={[styles.pointWinner,{color: colors.text}]}>
                                {point.point_winner === 'student' ? 'You' : match.opponent_name}
                            </Text>
                        </View>
                    ))}
                </AppCard>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {match.status === 'ongoing' && (
                        <ModernButton
                            title="Continue Recording"
                            onPress={() => navigation.navigate('LiveMatch', { matchId })}
                            variant="primary"
                            icon="play"
                            fullWidth
                            size="lg"
                        />
                    )}

                    {match.status === 'completed' && points.length >= 5 && (
                        <ModernButton
                            title="AI Analysis"
                            onPress={() => navigation.navigate('AIAnalysis', { matchId, match })}
                            variant="primary"
                            icon="robot"
                            fullWidth
                            size="lg"
                        />
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: COLORS.background,
    },
    scroll: {
        flex: 1,
    },
    card: {
        margin: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        // color: COLORS.text,
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        marginVertical: 2,
    },
    point: {
        marginVertical: 4,
        color: COLORS.textSecondary,
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
    buttonContainer: {
        margin: SPACING.lg,
    },
    continueButton: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
        textAlign: 'center',
        padding: SPACING.lg,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
    },
    actionsContainer: {
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    pointRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    pointNumber: {
        width: 40,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        // color: COLORS.primary,
    },
    pointScore: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.sm,
        // color: COLORS.text,
    },
    pointWinner: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        // color: COLORS.textSecondary,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    infoText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },
});

// ✅ مهم: default export
export default MatchDetailsScreen;