import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    AppText,
    Avatar,
    Badge,
    Button,
    Card,
    Header,
    ListRow,
    Screen,
    SectionHeader,
    SkeletonList,
} from '@tennis-platform/design-system';
import { colors, palette, radius, spacing } from '@tennis-platform/design-system';
import { digits, formatDate } from '@tennis-platform/shared-utils';
import { matchService } from '../services/matchService';
import { Match, Point } from '../types';

export default function MatchDetailsScreen({ route, navigation }: any) {
    const { matchId } = route.params;
    const [match, setMatch] = useState<Match | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMatchData();
    }, [matchId]);

    const loadMatchData = async () => {
        try {
            setLoading(true);
            const [matchData, pointsData] = await Promise.all([
                matchService.getById(matchId),
                matchService.getPoints(matchId),
            ]);
            setMatch((matchData as any)?.data || matchData);
            setPoints(pointsData || []);
        } catch (error) {
            console.error('Error loading match details:', error);
        } finally {
            setLoading(false);
        }
    };

    const header = (
        <Header
            title="جزئیات مسابقه"
            subtitle={match ? `در برابر ${match.opponent_name}` : undefined}
            back
            onBack={() => navigation.goBack()}
        />
    );

    const isOngoing = match?.status === 'ongoing';
    const isCompleted = match?.status === 'completed';
    const isWin = match?.final_result === 'win';
    const statusLabel = isOngoing ? 'در جریان' : isWin ? 'برد' : 'باخت';
    const statusColor = isOngoing ? palette.amber500 : isWin ? palette.green600 : palette.red500;
    const statusBg = isOngoing ? palette.amber100 : isWin ? palette.green100 : palette.red100;

    return (
        <Screen header={header}>
            {loading || !match ? (
                <SkeletonList rows={4} />
            ) : (
                <>
                    {/* Match Overview Card */}
                    <Card style={styles.heroCard}>
                        <View style={styles.heroHeader}>
                            <Avatar name={match.opponent_name || 'حریف'} size={50} />
                            <View style={styles.heroInfo}>
                                <AppText variant="h2">{`رقابت با ${match.opponent_name}`}</AppText>
                                <AppText variant="small" muted>
                                    {match.match_date ? formatDate(match.match_date) : 'مسابقه تنیس'}
                                </AppText>
                            </View>
                            <Badge label={statusLabel} color={statusColor} bg={statusBg} />
                        </View>

                        {match.sets_score && (
                            <View style={styles.scoreBox}>
                                <AppText variant="small" muted>نتیجه نهایی ست‌ها</AppText>
                                <AppText variant="number" color={palette.navy800}>
                                    {match.sets_score}
                                </AppText>
                            </View>
                        )}
                    </Card>

                    {/* Match Meta Information */}
                    <SectionHeader title="اطلاعات بازی" />
                    <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
                        <ListRow
                            icon="account-outline"
                            title="نام حریف"
                            subtitle={match.opponent_name}
                            divider
                        />
                        <ListRow
                            icon="map-marker-outline"
                            title="زمین / محل برگزاری"
                            subtitle={match.location || 'ثبت نشده'}
                            divider
                        />
                        <ListRow
                            icon="tennis"
                            title="نوع رقابت"
                            subtitle={match.match_type === 'doubles' ? 'دوبل (Doubles)' : 'انفرادی (Singles)'}
                            divider
                        />
                        <ListRow
                            icon="counter"
                            title="تعداد امتیازات ثبت‌شده"
                            subtitle={`${digits(points.length)} امتیاز`}
                        />
                    </Card>

                    {/* Action buttons */}
                    <View style={styles.actionContainer}>
                        {isOngoing && (
                            <Button
                                title="ادامه ثبت زنده امتیازات"
                                onPress={() => navigation.navigate('LiveMatch', { matchId })}
                                variant="primary"
                                icon="record-rec"
                                fullWidth
                                size="lg"
                            />
                        )}

                        {isCompleted && (
                            <Button
                                title="مشاهده تحلیل هوشمند (AI Analysis)"
                                onPress={() => navigation.navigate('AIAnalysis', { matchId, match })}
                                variant="navy"
                                icon="robot-outline"
                                fullWidth
                                size="lg"
                            />
                        )}
                    </View>

                    {/* Points breakdown list */}
                    {points.length > 0 && (
                        <>
                            <SectionHeader
                                title="خلاصه امتیازات بازی"
                                count={points.length}
                            />
                            <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
                                {points.slice(0, 15).map((point, index) => {
                                    const won = point.point_winner === 'student';
                                    return (
                                        <ListRow
                                            key={point.id}
                                            icon={won ? 'check-circle' : 'close-circle'}
                                            title={`امتیاز #${digits(point.point_number)} - نتیجه: ${point.game_score}`}
                                            subtitle={won ? 'برنده: بازیکن ما' : `برنده: ${match.opponent_name}`}
                                            right={
                                                <Badge
                                                    label={won ? 'برد' : 'باخت'}
                                                    color={won ? palette.green600 : palette.red500}
                                                    bg={won ? palette.green100 : palette.red100}
                                                />
                                            }
                                            divider={index < Math.min(points.length, 15) - 1}
                                        />
                                    );
                                })}
                            </Card>
                        </>
                    )}
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    heroCard: {
        gap: spacing.md,
    },
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    heroInfo: {
        flex: 1,
        gap: 3,
    },
    scoreBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
    },
    actionContainer: {
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
});
