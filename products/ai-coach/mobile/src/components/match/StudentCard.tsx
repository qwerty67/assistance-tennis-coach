import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    AppText,
    Avatar,
    Badge,
    Card,
    IconButton,
} from '@tennis-platform/design-system';
import { colors, palette, spacing } from '@tennis-platform/design-system';
import { digits } from '@tennis-platform/shared-utils';
import { Student } from '../../types';

interface StudentCardProps {
    student: Student;
    onPress?: () => void;
    onDelete?: () => void;
    index?: number;
}

export const StudentCard: React.FC<StudentCardProps> = ({
    student,
    onPress,
    onDelete,
    index,
}) => {
    const totalMatches = student.total_matches || 0;
    const wins = student.wins || 0;
    const winRate = student.win_rate ? student.win_rate.toFixed(0) : '0';

    return (
        <Card onPress={onPress} index={index}>
            <View style={styles.container}>
                <View style={styles.topRow}>
                    <Avatar name={student.name} size={46} />
                    <View style={styles.info}>
                        <AppText variant="h3" numberOfLines={1}>
                            {student.name}
                        </AppText>
                        <View style={styles.badgesRow}>
                            {student.phone ? (
                                <View style={styles.metaRow}>
                                    <MaterialCommunityIcons name="phone-outline" size={12} color={colors.textMuted} />
                                    <AppText variant="caption" muted>
                                        {digits(student.phone)}
                                    </AppText>
                                </View>
                            ) : null}
                            <Badge
                                label={student.level ? `سطح ${student.level}` : 'شاگرد فعال'}
                                color={palette.navy800}
                                bg={colors.surfaceMuted}
                            />
                        </View>
                    </View>

                    {onDelete && (
                        <IconButton
                            icon="trash-can-outline"
                            color={palette.red500}
                            size={36}
                            onPress={onDelete}
                            accessibilityLabel="حذف شاگرد"
                        />
                    )}
                </View>

                {/* Performance stats row */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <AppText variant="small" muted>مسابقات</AppText>
                        <AppText variant="bodyMedium" style={styles.statVal}>
                            {digits(totalMatches)}
                        </AppText>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statBox}>
                        <AppText variant="small" muted>بردها</AppText>
                        <AppText variant="bodyMedium" color={palette.green600} style={styles.statVal}>
                            {digits(wins)}
                        </AppText>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statBox}>
                        <AppText variant="small" muted>نرخ برد</AppText>
                        <AppText variant="bodyMedium" color={palette.violet500} style={styles.statVal}>
                            {`${digits(winRate)}٪`}
                        </AppText>
                    </View>
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing.md,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    info: {
        flex: 1,
        gap: 4,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    statBox: {
        alignItems: 'center',
        gap: 2,
    },
    statVal: {
        fontWeight: '700',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: colors.border,
    },
});

export default StudentCard;
