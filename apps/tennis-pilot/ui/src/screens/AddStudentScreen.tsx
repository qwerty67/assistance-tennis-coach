import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useToast } from '../context/ToastContext';
import { CustomHeader, ModernTextInput, ModernButton } from '../components/common';
import { studentService } from '../services/studentService';
import { StudentCreate } from '../types';
import { COLORS, SPACING } from '../theme';

interface AddStudentScreenProps {
    navigation: any;
}

export default function AddStudentScreen({ navigation }: AddStudentScreenProps) {
    const [formData, setFormData] = useState<StudentCreate>({
        name: '',
        phone: '',
        email: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (formData.phone && !/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
            newErrors.phone = 'Invalid phone number';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            toast.error('Please fix the errors');
            return;
        }

        try {
            setLoading(true);
            await studentService.create(formData);
            toast.success('Student created successfully');
            navigation.goBack();
        } catch (err) {
            console.error('Error creating student:', err);
            toast.error('Failed to create student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Add Student"
                onBack={() => navigation.goBack()}
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <ModernTextInput
                        label="Full Name"
                        placeholder="Enter student's full name"
                        value={formData.name}
                        onChangeText={(text) => {
                            setFormData({ ...formData, name: text });
                            if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        error={errors.name}
                        required
                        icon="account"
                        autoCapitalize="words"
                    />

                    <ModernTextInput
                        label="Phone Number"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChangeText={(text) => {
                            setFormData({ ...formData, phone: text });
                            if (errors.phone) setErrors({ ...errors, phone: '' });
                        }}
                        error={errors.phone}
                        icon="phone"
                        keyboardType="phone-pad"
                    />

                    <ModernTextInput
                        label="Email Address"
                        placeholder="student@example.com"
                        value={formData.email}
                        onChangeText={(text) => {
                            setFormData({ ...formData, email: text });
                            if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        error={errors.email}
                        icon="email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <ModernTextInput
                        label="Notes"
                        placeholder="Additional information about the student..."
                        value={formData.notes}
                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                        icon="note-text"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={styles.multilineInput}
                    />

                    <View style={styles.buttonContainer}>
                        <ModernButton
                            title="Create Student"
                            onPress={handleSubmit}
                            variant="primary"
                            icon="check"
                            loading={loading}
                            disabled={loading}
                            fullWidth
                            size="lg"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.xl,
    },
    multilineInput: {
        minHeight: 120,
    },
    buttonContainer: {
        marginTop: SPACING.xl,
    },
});