import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, PanResponder, Platform, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToast, Toast } from '../../context/ToastContext';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';

const ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    success: 'check-circle',
    error: 'alert-circle',
    warning: 'alert',
    info: 'information',
};

const COLORS_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    success: {
        bg: COLORS.successLight,
        border: COLORS.success,
        text: '#1B5E20',
        icon: COLORS.success,
    },
    error: {
        bg: COLORS.errorLight,
        border: COLORS.error,
        text: '#B71C1C',
        icon: COLORS.error,
    },
    warning: {
        bg: COLORS.warningLight,
        border: COLORS.warning,
        text: '#E65100',
        icon: COLORS.warning,
    },
    info: {
        bg: '#E6F0FF',
        border: COLORS.primary,
        text: '#0D47A1',
        icon: COLORS.primary,
    },
};

interface ToastItemProps {
    toast: Toast;
    onHide: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-100)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const colors = COLORS_MAP[toast.type];

    useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy < 0) {
                    translateY.setValue(gestureState.dy);
                    opacity.setValue(1 + gestureState.dy / 100);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy < -50 || gestureState.vy < -0.5) {
                    // Swipe up - dismiss
                    Animated.parallel([
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateY, {
                            toValue: -100,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start(() => onHide(toast.id));
                } else {
                    // Snap back
                    Animated.parallel([
                        Animated.timing(opacity, {
                            toValue: 1,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.spring(translateY, {
                            toValue: 0,
                            friction: 8,
                            tension: 40,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }
            },
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    backgroundColor: colors.bg,
                    borderLeftColor: colors.border,
                    opacity,
                    transform: [{ translateY }, { translateX }],
                },
            ]}
            {...panResponder.panHandlers}
        >
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                    name={ICONS[toast.type]}
                    size={22}
                    color={colors.icon}
                />
            </View>
            <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
                {toast.message}
            </Text>
        </Animated.View>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, hideToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onHide={hideToast} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 30,
        left: SPACING.lg,
        right: SPACING.lg,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.sm,
        borderLeftWidth: 4,
        ...SHADOWS.md,
    },
    iconContainer: {
        marginRight: SPACING.md,
    },
    message: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        lineHeight: TYPOGRAPHY.fontSize.md * 1.4,
    },
});