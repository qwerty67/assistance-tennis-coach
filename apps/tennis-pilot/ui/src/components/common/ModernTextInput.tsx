import React, { useState } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, TextInputProps } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';

interface ModernTextInputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    required?: boolean;
    containerStyle?: any;
}

export const ModernTextInput: React.FC<ModernTextInputProps> = ({
                                                                    label,
                                                                    error,
                                                                    icon,
                                                                    required = false,
                                                                    containerStyle,
                                                                    ...props
                                                                }) => {
    const [isFocused, setIsFocused] = useState(false);

    const getBorderColor = () => {
        if (error) return COLORS.error;
        if (isFocused) return COLORS.primary;
        return COLORS.border;
    };

    const getBackgroundColor = () => {
        if (error) return COLORS.errorLight;
        if (isFocused) return COLORS.primaryLight;
        return COLORS.surface;
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>
                        {label}
                        {required && <Text style={styles.required}> *</Text>}
                    </Text>
                </View>
            )}

            <View
                style={[
                    styles.inputContainer,
                    {
                        borderColor: getBorderColor(),
                        backgroundColor: getBackgroundColor(),
                    },
                ]}
            >
                {icon && (
                    <MaterialCommunityIcons
                        name={icon}
                        size={20}
                        color={error ? COLORS.error : isFocused ? COLORS.primary : COLORS.textSecondary}
                        style={styles.icon}
                    />
                )}

                <RNTextInput
                    style={styles.input}
                    placeholderTextColor={COLORS.textTertiary}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    {...props}
                />
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={14} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.lg,
    },
    labelContainer: {
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
    },
    required: {
        color: COLORS.error,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.lg,
        minHeight: 52,
    },
    icon: {
        marginRight: SPACING.md,
    },
    input: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.text,
        paddingVertical: SPACING.md,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    errorText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.error,
        marginLeft: SPACING.xs,
    },
});