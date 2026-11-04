import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';

interface EmptyStateProps {
    icon?: string;
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
                                                          icon = 'inbox',
                                                          title,
                                                          message,
                                                          actionLabel,
                                                          onAction,
                                                      }) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={icon as any} size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
            {actionLabel && onAction && (
                <TouchableOpacity style={styles.button} onPress={onAction}>
                    <Text style={styles.buttonText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxxl,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        textAlign: 'center',
    },
    message: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    button: {
        marginTop: SPACING.xl,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xxl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.pill,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
});