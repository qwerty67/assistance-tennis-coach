import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { COLORS, SPACING, RADIUS } from '../../theme';

export const SkeletonStatGrid: React.FC = () => {
    return (
        <View style={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.statItem}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={50} height={24} style={styles.value} />
                    <Skeleton width={60} height={14} />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: SPACING.lg,
    },
    statItem: {
        alignItems: 'center',
        minWidth: '45%',
        marginBottom: SPACING.md,
    },
    value: {
        marginTop: SPACING.sm,
    },
});