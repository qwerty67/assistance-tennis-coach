import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Animated, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';

interface ActionSheetItem {
    label: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
    destructive?: boolean;
}

interface ActionSheetProps {
    visible: boolean;
    title?: string;
    items: ActionSheetItem[];
    onDismiss: () => void;
}

const { height } = Dimensions.get('window');

export const ActionSheet: React.FC<ActionSheetProps> = ({
                                                            visible,
                                                            title,
                                                            items,
                                                            onDismiss,
                                                        }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
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
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onDismiss}
        >
            <TouchableWithoutFeedback onPress={onDismiss}>
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.sheet,
                                { transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            {title && (
                                <View style={styles.header}>
                                    <Text style={styles.title}>{title}</Text>
                                </View>
                            )}

                            <View style={styles.itemsContainer}>
                                {items.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.item}
                                        onPress={() => {
                                            item.onPress();
                                            onDismiss();
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        {item.icon && (
                                            <MaterialCommunityIcons
                                                name={item.icon}
                                                size={22}
                                                color={item.destructive ? COLORS.error : COLORS.text}
                                                style={styles.itemIcon}
                                            />
                                        )}
                                        <Text
                                            style={[
                                                styles.itemText,
                                                item.destructive && styles.destructiveText,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onDismiss}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
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
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xxl,
        borderTopRightRadius: RADIUS.xxl,
        paddingBottom: SPACING.xxl,
        ...SHADOWS.xl,
    },
    header: {
        padding: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        textAlign: 'center',
    },
    itemsContainer: {
        paddingVertical: SPACING.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
    },
    itemIcon: {
        marginRight: SPACING.lg,
    },
    itemText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.text,
    },
    destructiveText: {
        color: COLORS.error,
    },
    cancelButton: {
        marginTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingVertical: SPACING.lg,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
});