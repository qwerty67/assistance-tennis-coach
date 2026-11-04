import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
    return (
        <View style={styles.container}>
            <View style={styles.spinner}>
                <View style={styles.dot} />
            </View>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    spinner: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
    },
    text: {
        marginTop: SPACING.lg,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
    },
});