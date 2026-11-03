import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../theme';

interface ModernButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    fullWidth?: boolean;
    disabled?: boolean;
    loading?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const ModernButton: React.FC<ModernButtonProps> = ({
                                                              title,
                                                              onPress,
                                                              variant = 'primary',
                                                              icon,
                                                              fullWidth = false,
                                                              disabled = false,
                                                              loading = false,
                                                              size = 'md',
                                                          }) => {
    const { colors } = useTheme();

    const getButtonStyle = (): ViewStyle => {
        switch (variant) {
            case 'primary':
                return { backgroundColor: colors.primary };
            case 'secondary':
                return { backgroundColor: colors.secondary };
            case 'outline':
                return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
            case 'destructive':
                return { backgroundColor: colors.error };
            default:
                return { backgroundColor: 'transparent' };
        }
    };

    const getTextColor = () => {
        if (variant === 'outline' || variant === 'ghost') {
            return variant === 'outline' ? colors.primary : colors.text;
        }
        return colors.textInverse;
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
            case 'lg':
                return { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl };
            default:
                return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getButtonStyle(),
                getSizeStyle(),
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {icon && (
                        <MaterialCommunityIcons
                            name={icon}
                            size={size === 'sm' ? 18 : 22}
                            color={getTextColor()}
                            style={styles.icon}
                        />
                    )}
                    <Text style={[styles.text, { color: getTextColor() }]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.lg,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },
    icon: {
        marginRight: SPACING.sm,
    },
    text: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
});