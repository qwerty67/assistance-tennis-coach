import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../../theme';

interface CustomHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightAction?: {
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        onPress: () => void;
        color?: string;
    };
    rightActions?: Array<{
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        onPress: () => void;
        color?: string;
    }>;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
                                                              title,
                                                              subtitle,
                                                              onBack,
                                                              rightAction,
                                                              rightActions,
                                                          }) => {
    const { colors } = useTheme();

    const allRightActions = [];
    if (rightActions) {
        allRightActions.push(...rightActions.map(a => ({ type: 'action' as const, ...a })));
    } else if (rightAction) {
        allRightActions.push({ type: 'action' as const, ...rightAction });
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.leftSection}>
                {onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.titleSection}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle && (
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                        {subtitle}
                    </Text>
                )}
            </View>

            <View style={styles.rightSection}>
                {allRightActions.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={action.onPress}
                        style={styles.actionButton}
                    >
                        <MaterialCommunityIcons
                            name={action.icon}
                            size={24}
                            color={action.color || colors.text}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    leftSection: { width: 48, alignItems: 'flex-start' },
    titleSection: { flex: 1, alignItems: 'center' },
    rightSection: { width: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: SPACING.xs },
    backButton: { padding: SPACING.xs },
    actionButton: { padding: SPACING.xs },
    title: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.bold },
    subtitle: { fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 2 },
});