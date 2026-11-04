import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme';

interface StatItemProps {
    label: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const StatItem: React.FC<StatItemProps> = ({
                                                      label,
                                                      value,
                                                      subtitle,
                                                      color = COLORS.text,
                                                      icon,
                                                  }) => {
    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
            </View>
            <Text style={[styles.value, { color }]} numberOfLines={1}>
                {value}
            </Text>
            <Text style={styles.label} numberOfLines={1}>
                {label}
            </Text>
            {subtitle && (
                <Text style={[styles.subtitle, { color }]} numberOfLines={1}>
                    {subtitle}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
        minWidth: '45%', // برای چیدمان ۲ ستونه در موبایل
        marginBottom: SPACING.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    value: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        marginTop: 2,
    },
});