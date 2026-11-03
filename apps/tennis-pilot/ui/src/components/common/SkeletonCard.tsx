import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { COLORS, SPACING, RADIUS } from '../../theme';
import {useTheme} from "../../context/ThemeContext";

export const SkeletonCard: React.FC = () => {
    const { colors } = useTheme(); // ✅ دریافت colors

    return (
        <View style={[styles.card,{backgroundColor: colors.surface}]}>
            <Skeleton height={20} width="60%" style={styles.title} />
            <Skeleton height={16} width="100%" style={styles.line} />
            <Skeleton height={16} width="80%" style={styles.line} />
            <Skeleton height={16} width="90%" style={styles.line} />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        // backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    title: {
        marginBottom: SPACING.md,
    },
    line: {
        marginBottom: SPACING.sm,
    },
});