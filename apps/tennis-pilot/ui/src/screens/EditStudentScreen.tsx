import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomHeader, AppCard, ModernButton, ModernTextInput } from '../components/common';
import { studentService } from '../services/studentService';
import { useToast } from '../context/ToastContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';

export default function EditStudentScreen({ route, navigation }: any) {
    const { studentId } = route.params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [student, setStudent] = useState<any>(null);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');

    const [errors, setErrors] = useState<any>({});

    const toast = useToast();

    useEffect(() => {
        loadStudent();
    }, [studentId]);

    const loadStudent = async () => {
        try {
            setLoading(true);
            const data = await studentService.getById(studentId);
            setStudent(data?.data);

            // پر کردن فیلدها با داده‌های موجود
            setName(data?.data.name || '');
            setPhone(data?.data.phone || '');
            setEmail(data?.data.email || '');
            setNotes(data?.data.notes || '');

        } catch (error) {
            console.error('Error loading student:', error);
            toast.error('خطا در بارگذاری اطلاعات شاگرد');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const validate = (): boolean => {
        const newErrors: any = {};

        if (!name.trim()) {
            newErrors.name = 'نام شاگرد الزامی است';
        } else if (name.trim().length < 2) {
            newErrors.name = 'نام باید حداقل ۲ کاراکتر باشد';
        }

        if (phone && !/^[\d\s\-\+\(\)]{7,20}$/.test(phone)) {
            newErrors.phone = 'شماره تماس معتبر نیست';
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'ایمیل معتبر نیست';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            toast.error('لطفاً خطاهای فرم را برطرف کنید');
            return;
        }

        try {
            setSaving(true);

            const updateData = {
                name: name.trim(),
                phone: phone.trim() || null,
                email: email.trim() || null,
                notes: notes.trim() || null,
            };

            await studentService.update(studentId, updateData);

            toast.success('اطلاعات شاگرد با موفقیت ویرایش شد');
            navigation.goBack();

        } catch (error: any) {
            console.error('Error updating student:', error);
            toast.error(error?.response?.data?.detail || 'خطا در ویرایش اطلاعات');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !student) {
        return (
            <View style={styles.container}>
                <CustomHeader title="ویرایش شاگرد" onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>در حال بارگذاری...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CustomHeader
                title="ویرایش شاگرد"
                onBack={() => navigation.goBack()}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* هدر با آواتار */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatar}>
                            <MaterialCommunityIcons name="account-edit" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.subtitle}>اطلاعات زیر را ویرایش کنید</Text>
                    </View>

                    {/* فرم */}
                    <AppCard style={styles.formCard}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="form-textbox" size={22} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>اطلاعات شخصی</Text>
                        </View>

                        <View style={styles.formContainer}>
                            {/* نام */}
                            <ModernTextInput
                                label="نام و نام خانوادگی"
                                value={name}
                                onChangeText={setName}
                                placeholder="مثلاً: طه احمدی"
                                error={errors.name}
                                icon="account"
                                required
                                textAlign="right"
                            />

                            {/* شماره تماس */}
                            <ModernTextInput
                                label="شماره تماس"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                                error={errors.phone}
                                icon="phone"
                                keyboardType="phone-pad"
                                textAlign="right"
                            />

                            {/* ایمیل */}
                            <ModernTextInput
                                label="ایمیل"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="example@email.com"
                                error={errors.email}
                                icon="email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                textAlign="left"
                            />

                            {/* یادداشت‌ها - چند خطی */}
                            <ModernTextInput
                                label="یادداشت‌ها"
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="توضیحات، سطح بازی، نقاط قوت و ضعف..."
                                error={errors.notes}
                                icon="note-text"
                                multiline
                                numberOfLines={4}
                                textAlign="right"
                                style={styles.notesInput}
                            />
                        </View>
                    </AppCard>

                    {/* دکمه‌های عملیات */}
                    <View style={styles.buttonContainer}>
                        <ModernButton
                            title="ذخیره تغییرات"
                            onPress={handleSave}
                            variant="primary"
                            icon="content-save"
                            fullWidth
                            size="lg"
                            loading={saving}
                        />

                        <View style={{ height: SPACING.sm }} />

                        <ModernButton
                            title="انصراف"
                            onPress={() => navigation.goBack()}
                            variant="outline"
                            icon="close"
                            fullWidth
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { paddingBottom: SPACING.xxxl },

    loadingText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        color: COLORS.textSecondary,
        marginTop: SPACING.lg,
    },

    // آواتار
    avatarSection: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    studentName: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },

    // فرم
    formCard: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    cardTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginRight: SPACING.sm,
        textAlign: 'right',
    },
    formContainer: {
        gap: SPACING.md,
    },

    // یادداشت چند خطی
    notesInput: {
        height: 120,
        textAlignVertical: 'top',
    },

    buttonContainer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
    },
});