import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
    Button,
    Card,
    Header,
    Screen,
    TextField,
} from '@tennis-platform/design-system';
import { spacing } from '@tennis-platform/design-system';
import { useToast } from '../context/ToastContext';
import { studentService } from '../services/studentService';
import { StudentCreate } from '../types';

export default function AddStudentScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) {
            newErrors.name = 'نام و نام خانوادگی الزامی است';
        }
        if (phone && phone.trim().length < 10) {
            newErrors.phone = 'شماره موبایل باید حداقل ۱۰ رقم باشد';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            toast.error('لطفاً فیلدهای الزامی را بررسی نمایید');
            return;
        }

        try {
            setLoading(true);
            const payload: StudentCreate = {
                name: name.trim(),
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                notes: notes.trim() || undefined,
                coach_notes: notes.trim() || undefined,
            };
            await studentService.create(payload);
            toast.success('شاگرد با موفقیت ثبت شد');
            navigation.goBack();
        } catch (err: any) {
            console.error('Error creating student:', err);
            toast.error(err?.response?.data?.detail || 'خطا در ثبت شاگرد');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen
            header={
                <Header
                    title="افزودن شاگرد جدید"
                    back
                    onBack={() => navigation.goBack()}
                />
            }
        >
            <Card style={styles.formCard}>
                <TextField
                    label="نام و نام خانوادگی *"
                    placeholder="مثال: کیان راد"
                    value={name}
                    onChangeText={setName}
                    error={errors.name}
                    icon="account"
                />

                <TextField
                    label="شماره تلفن همراه"
                    placeholder="09121234567"
                    value={phone}
                    onChangeText={setPhone}
                    error={errors.phone}
                    icon="phone"
                    keyboardType="phone-pad"
                    ltr
                />

                <TextField
                    label="پست الکترونیک (ایمیل)"
                    placeholder="student@example.com"
                    value={email}
                    onChangeText={setEmail}
                    icon="email-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    ltr
                />

                <TextField
                    label="یادداشت‌های اختصاصی مربی"
                    placeholder="نقاط قوت، سبک بازی، یا یادداشت‌های مربیگری..."
                    value={notes}
                    onChangeText={setNotes}
                    icon="note-text-outline"
                    multiline
                    numberOfLines={3}
                />

                <View style={styles.buttonContainer}>
                    <Button
                        title="ثبت شاگرد"
                        onPress={handleSubmit}
                        variant="navy"
                        icon="check"
                        loading={loading}
                        fullWidth
                        size="lg"
                    />
                </View>
            </Card>
        </Screen>
    );
}

const styles = StyleSheet.create({
    formCard: {
        gap: spacing.md,
        padding: spacing.xl,
    },
    buttonContainer: {
        marginTop: spacing.md,
    },
});
