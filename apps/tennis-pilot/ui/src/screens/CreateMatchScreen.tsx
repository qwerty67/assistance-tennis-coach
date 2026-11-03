import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useToast } from '../context/ToastContext';
import { CustomHeader, ModernTextInput, ModernSelect, ModernButton } from '../components/common';
import { matchService } from '../services/matchService';
import { studentService } from '../services/studentService';
import { MatchCreate, Student } from '../types';
import { COLORS, SPACING } from '../theme';

interface CreateMatchScreenProps {
    navigation: any;
}

export default function CreateMatchScreen({ navigation }: CreateMatchScreenProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [formData, setFormData] = useState<MatchCreate>({
        student_id: 0,
        opponent_name: '',
        match_date: new Date().toISOString().split('T')[0],
        location: '',
        match_type: 'singles',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const data = await studentService.getAll();
            setStudents(data);
        } catch (err) {
            console.error('Error loading students:', err);
            toast.error('Failed to load students');
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.student_id) {
            newErrors.student_id = 'Please select a student';
        }

        if (!formData.opponent_name.trim()) {
            newErrors.opponent_name = 'Opponent name is required';
        } else if (formData.opponent_name.trim().length < 2) {
            newErrors.opponent_name = 'Name must be at least 2 characters';
        }

        if (!formData.match_date) {
            newErrors.match_date = 'Match date is required';
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
            await matchService.create(formData);
            toast.success('Match created successfully');
            navigation.goBack();
        } catch (err) {
            console.error('Error creating match:', err);
            toast.error('Failed to create match');
        } finally {
            setLoading(false);
        }
    };

    const studentOptions = students.map((s) => ({
        label: s.name,
        value: s.id,
    }));

    const matchTypeOptions = [
        { label: 'Singles', value: 'singles' },
        { label: 'Doubles', value: 'doubles' },
    ];

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Create Match"
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
                    <ModernSelect
                        label="Select Student"
                        placeholder="Choose a student"
                        options={studentOptions}
                        value={formData.student_id || undefined}
                        onSelect={(value) => {
                            setFormData({ ...formData, student_id: value as number });
                            if (errors.student_id) setErrors({ ...errors, student_id: '' });
                        }}
                        error={errors.student_id}
                        required
                        icon="account"
                    />

                    <ModernTextInput
                        label="Opponent Name"
                        placeholder="Enter opponent's name"
                        value={formData.opponent_name}
                        onChangeText={(text) => {
                            setFormData({ ...formData, opponent_name: text });
                            if (errors.opponent_name) setErrors({ ...errors, opponent_name: '' });
                        }}
                        error={errors.opponent_name}
                        required
                        icon="account-group"
                        autoCapitalize="words"
                    />

                    <ModernTextInput
                        label="Match Date"
                        placeholder="YYYY-MM-DD"
                        value={formData.match_date}
                        onChangeText={(text) => {
                            setFormData({ ...formData, match_date: text });
                            if (errors.match_date) setErrors({ ...errors, match_date: '' });
                        }}
                        error={errors.match_date}
                        required
                        icon="calendar"
                    />

                    <ModernSelect
                        label="Match Type"
                        placeholder="Select match type"
                        options={matchTypeOptions}
                        value={formData.match_type}
                        onSelect={(value) => setFormData({ ...formData, match_type: value as string })}
                        icon="tennis"
                    />

                    <ModernTextInput
                        label="Location"
                        placeholder="Enter match location"
                        value={formData.location}
                        onChangeText={(text) => setFormData({ ...formData, location: text })}
                        icon="map-marker"
                        autoCapitalize="words"
                    />

                    <ModernTextInput
                        label="Notes"
                        placeholder="Additional notes about the match..."
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
                            title="Create Match"
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