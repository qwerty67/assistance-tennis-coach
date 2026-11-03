import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../theme';

interface SelectOption {
    label: string;
    value: string | number;
}

interface ModernSelectProps {
    label?: string;
    placeholder?: string;
    options: SelectOption[];
    value?: string | number;
    onSelect: (value: string | number) => void;
    error?: string;
    required?: boolean;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({
                                                              label,
                                                              placeholder = 'Select...',
                                                              options,
                                                              value,
                                                              onSelect,
                                                              error,
                                                              required = false,
                                                              icon,
                                                          }) => {
    const [visible, setVisible] = useState(false);

    const selectedOption = options.find((opt) => opt.value === value);

    const getBorderColor = () => {
        if (error) return COLORS.error;
        if (visible) return COLORS.primary;
        return COLORS.border;
    };

    return (
        <View style={styles.container}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>
                        {label}
                        {required && <Text style={styles.required}> *</Text>}
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={[
                    styles.selectContainer,
                    {
                        borderColor: getBorderColor(),
                        backgroundColor: error ? COLORS.errorLight : visible ? COLORS.primaryLight : COLORS.surface,
                    },
                ]}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                {icon && (
                    <MaterialCommunityIcons
                        name={icon}
                        size={20}
                        color={error ? COLORS.error : visible ? COLORS.primary : COLORS.textSecondary}
                        style={styles.icon}
                    />
                )}

                <Text
                    style={[
                        styles.selectText,
                        !selectedOption && styles.placeholder,
                    ]}
                    numberOfLines={1}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>

                <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={COLORS.textSecondary}
                />
            </TouchableOpacity>

            {error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={14} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || 'Select'}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.option,
                                        item.value === value && styles.optionSelected,
                                    ]}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setVisible(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            item.value === value && styles.optionTextSelected,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {item.value === value && (
                                        <MaterialCommunityIcons name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
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
    selectContainer: {
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
    selectText: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.text,
    },
    placeholder: {
        color: COLORS.textTertiary,
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
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        width: '100%',
        maxHeight: '70%',
        ...SHADOWS.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    optionSelected: {
        backgroundColor: COLORS.primaryLight,
    },
    optionText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.text,
    },
    optionTextSelected: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
});