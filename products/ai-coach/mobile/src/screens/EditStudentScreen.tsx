import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Header,
    Screen,
    SkeletonList,
    TextField,
} from '@tennis-platform/design-system';
import { spacing } from '@tennis-platform/design-system';
import { studentService } from '../services/studentService';
import { useToast } from '../context/ToastContext';

export default function EditStudentScreen({ route, navigation }: any) {
    const { studentId } = route.params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const toast = useToast();

    useEffect(() => {
        loadStudent();
    }, [studentId]);

    const loadStudent = async () => {
        try {
            setLoading(true);
            const data = await studentService.getById(studentId);
            const s = (data as any)?.data || data;
            setName(s.name || '');
            setPhone(s.phone || '');
            setEmail(s.email || '');
            setNotes(s.notes || s.coach_notes || '');
        } catch (error) {
            console.error('Error loading student:', error);
            toast.error('خطا در دریافت مشخصات شاگرد');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) {
            newErrors.name = 'نام و نام خانوادگی الزامی است';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            toast.error('لطفاً خطاهای فرم را برطرف نمایید');
            return;
        }

        try {
            setSaving(true);
            const updateData = {
                name: name.trim(),
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                notes: notes.trim() || undefined,
                coach_notes: notes.trim() || undefined,
            };

            await studentService.update(studentId, updateData);
            toast.success('اطلاعات شاگرد با موفقیت ذخیره شد');
            navigation.goBack();
        } catch (error: any) {
            console.error('Error updating student:', error);
            toast.error(error?.response?.data?.detail || 'خطا در ویرایش اطلاعات');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Screen
            header={
                <Header
                    title="ویرایش مشخصات شاگرد"
                    back
                    onBack={() => navigation.goBack()}
                />
            }
        >
            {loading ? (
                <SkeletonList rows={4} />
            ) : (
                <>
                    <View style={styles.avatarHeader}>
                        <Avatar name={name} size={70} />
                    </View>

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
                            label="یادداشت‌های مربی"
                            placeholder="توضیحات و نکات آموزشی..."
                            value={notes}
                            onChangeText={setNotes}
                            icon="note-text-outline"
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.buttonContainer}>
                            <Button
                                title="ذخیره تغییرات"
                                onPress={handleSave}
                                variant="navy"
                                icon="check"
                                loading={saving}
                                fullWidth
                                size="lg"
                            />
                        </View>
                    </Card>
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    avatarHeader: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    formCard: {
        gap: spacing.md,
        padding: spacing.xl,
    },
    buttonContainer: {
        marginTop: spacing.sm,
    },
});
