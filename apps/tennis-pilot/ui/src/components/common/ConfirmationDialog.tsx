import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Animated, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';

interface ActionButton {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'destructive' | 'cancel';
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface ConfirmationDialogProps {
    visible: boolean;
    title: string;
    message: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor?: string;
    actions: ActionButton[];
    onDismiss?: () => void;
}

const { width } = Dimensions.get('window');
const DIALOG_WIDTH = Math.min(width - 64, 340);

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
                                                                          visible,
                                                                          title,
                                                                          message,
                                                                          icon,
                                                                          iconColor = COLORS.primary,
                                                                          actions,
                                                                          onDismiss,
                                                                      }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 50,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const getButtonStyle = (variant?: string) => {
        switch (variant) {
            case 'destructive':
                return styles.destructiveButton;
            case 'primary':
                return styles.primaryButton;
            case 'cancel':
            default:
                return styles.cancelButton;
        }
    };

    const getButtonTextStyle = (variant?: string) => {
        switch (variant) {
            case 'destructive':
                return styles.destructiveButtonText;
            case 'primary':
                return styles.primaryButtonText;
            case 'cancel':
            default:
                return styles.cancelButtonText;
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onDismiss}
        >
            <TouchableWithoutFeedback onPress={onDismiss}>
                <Animated.View
                    style={[
                        styles.overlay,
                        { opacity: fadeAnim }
                    ]}
                >
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.dialog,
                                {
                                    opacity: fadeAnim,
                                    transform: [
                                        { scale: scaleAnim },
                                        { translateY: slideAnim },
                                    ],
                                },
                            ]}
                        >
                            {/* Icon */}
                            {icon && (
                                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                                    <MaterialCommunityIcons
                                        name={icon}
                                        size={32}
                                        color={iconColor}
                                    />
                                </View>
                            )}

                            {/* Title */}
                            <Text style={styles.title}>{title}</Text>

                            {/* Message */}
                            <Text style={styles.message}>{message}</Text>

                            {/* Actions */}
                            <View style={styles.actionsContainer}>
                                {actions.map((action, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.actionButton,
                                            getButtonStyle(action.variant),
                                            actions.length === 1 && styles.fullWidthButton,
                                        ]}
                                        onPress={action.onPress}
                                        activeOpacity={0.7}
                                    >
                                        {action.icon && (
                                            <MaterialCommunityIcons
                                                name={action.icon}
                                                size={18}
                                                color={
                                                    action.variant === 'destructive' ? COLORS.error :
                                                        action.variant === 'primary' ? COLORS.white :
                                                            COLORS.text
                                                }
                                                style={styles.actionIcon}
                                            />
                                        )}
                                        <Text style={[
                                            styles.actionText,
                                            getButtonTextStyle(action.variant),
                                        ]}>
                                            {action.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    dialog: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xxl,
        padding: SPACING.xxl,
        width: DIALOG_WIDTH,
        alignItems: 'center',
        ...SHADOWS.xl,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    message: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: TYPOGRAPHY.fontSize.md * 1.5,
        marginBottom: SPACING.xl,
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        minWidth: '45%',
    },
    fullWidthButton: {
        width: '100%',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
    },
    destructiveButton: {
        backgroundColor: COLORS.errorLight,
    },
    actionText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    cancelButtonText: {
        color: COLORS.text,
    },
    primaryButtonText: {
        color: COLORS.white,
    },
    destructiveButtonText: {
        color: COLORS.error,
    },
    actionIcon: {
        marginRight: SPACING.xs,
    },
});