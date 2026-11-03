import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppCard } from '../common';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';

interface AnalysisCardProps {
    title: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor?: string;
    children: React.ReactNode;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
                                                              title,
                                                              icon,
                                                              iconColor = COLORS.primary,
                                                              children,
                                                          }) => {
    return (
        <AppCard style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                    <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
                </View>
                <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.content}>{children}</View>
        </AppCard>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
    },
    content: {},
});