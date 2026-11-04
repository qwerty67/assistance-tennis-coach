import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, RADIUS, fonts, palette } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'navy' | 'accent';

interface ModernButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
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
            case 'navy':
                return { backgroundColor: palette.navy800 };
            case 'accent':
                return { backgroundColor: palette.lime400 };
            case 'secondary':
                return { backgroundColor: palette.green100 };
            case 'outline':
                return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
            case 'destructive':
                return { backgroundColor: colors.error };
            default:
                return { backgroundColor: 'transparent' };
        }
    };

    const getTextColor = () => {
        if (variant === 'accent') {
            return palette.navy900;
        }
        if (variant === 'secondary') {
            return palette.green600;
        }
        if (variant === 'outline') {
            return colors.primary;
        }
        if (variant === 'ghost') {
            return colors.text;
        }
        return '#FFFFFF';
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return { height: 38, paddingHorizontal: SPACING.md };
            case 'lg':
                return { height: 54, paddingHorizontal: SPACING.xl };
            default:
                return { height: 48, paddingHorizontal: SPACING.lg };
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
                <View style={styles.contentRow}>
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
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },
    icon: {
        marginRight: 2,
    },
    text: {
        fontSize: 15,
        fontFamily: fonts.bold,
    },
});
