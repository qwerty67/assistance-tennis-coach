import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { COLORS, SPACING } from '../../theme';

export const SkeletonAvatar: React.FC = () => {
    return (
        <View style={styles.container}>
            <Skeleton width={96} height={96} borderRadius={48} />
            <Skeleton width={150} height={24} style={styles.name} />
            <Skeleton width={100} height={16} style={styles.subtitle} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    name: {
        marginTop: SPACING.md,
    },
    subtitle: {
        marginTop: SPACING.xs,
    },
});