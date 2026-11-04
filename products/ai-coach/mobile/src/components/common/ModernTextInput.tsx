import React, { useState } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, fonts } from '../../theme';

interface ModernTextInputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    onRightIconPress?: () => void;
    required?: boolean;
    containerStyle?: any;
    hint?: string;
}

export const ModernTextInput: React.FC<ModernTextInputProps> = ({
    label,
    error,
    icon,
    rightIcon,
    onRightIconPress,
    required = false,
    containerStyle,
    hint,
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
        if (isFocused) return '#FFFFFF';
        return COLORS.surfaceVariant;
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

                {rightIcon && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        activeOpacity={0.7}
                        style={styles.rightIconButton}
                    >
                        <MaterialCommunityIcons
                            name={rightIcon}
                            size={20}
                            color={COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {hint && !error && (
                <Text style={styles.hintText}>{hint}</Text>
            )}

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
        marginBottom: SPACING.md,
    },
    labelContainer: {
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: 13,
        fontFamily: fonts.medium,
        color: COLORS.text,
        textAlign: 'right',
    },
    required: {
        color: COLORS.error,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        minHeight: 50,
    },
    icon: {
        marginRight: SPACING.sm,
    },
    rightIconButton: {
        padding: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontFamily: fonts.regular,
        color: COLORS.text,
        paddingVertical: SPACING.sm,
    },
    hintText: {
        fontSize: 11,
        fontFamily: fonts.regular,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'right',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xs,
        justifyContent: 'flex-end',
        gap: 4,
    },
    errorText: {
        fontSize: 12,
        fontFamily: fonts.regular,
        color: COLORS.error,
    },
});
