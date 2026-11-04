import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
    Button,
    Card,
    Chips,
    Header,
    Screen,
    TextField,
} from '@tennis-platform/design-system';
import { spacing } from '@tennis-platform/design-system';
import { useToast } from '../context/ToastContext';
import { matchService } from '../services/matchService';
import { studentService } from '../services/studentService';
import { MatchCreate, Student } from '../types';

export default function CreateMatchScreen({ navigation }: any) {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | number>('');
    const [opponentName, setOpponentName] = useState('');
    const [location, setLocation] = useState('');
    const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
    const [notes, setNotes] = useState('');
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
            if (data.length > 0 && !selectedStudentId) {
                setSelectedStudentId(data[0].id);
            }
        } catch (err) {
            console.error('Error loading students:', err);
            toast.error('خطا در دریافت لیست شاگردان');
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!selectedStudentId) {
            newErrors.student = 'انتخاب شاگرد الزامی است';
        }
        if (!opponentName.trim()) {
            newErrors.opponent = 'نام حریف الزامی است';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            toast.error('لطفاً فیلدهای الزامی را پر کنید');
            return;
        }

        try {
            setLoading(true);
            const payload: MatchCreate = {
                student_id: selectedStudentId,
                opponent_name: opponentName.trim(),
                match_date: new Date().toISOString().split('T')[0],
                location: location.trim() || undefined,
                match_type: matchType,
                notes: notes.trim() || undefined,
            };
            const newMatch = await matchService.create(payload);
            toast.success('مسابقه با موفقیت ایجاد شد');
            navigation.replace('LiveMatch', { matchId: newMatch.id });
        } catch (err: any) {
            console.error('Error creating match:', err);
            toast.error(err?.response?.data?.detail || 'خطا در ثبت مسابقه');
        } finally {
            setLoading(false);
        }
    };

    const studentChips = students.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    return (
        <Screen
            header={
                <Header
                    title="ایجاد مسابقه جدید"
                    back
                    onBack={() => navigation.goBack()}
                />
            }
        >
            <Card style={styles.formCard}>
                <Chips
                    scroll
                    label="انتخاب شاگرد / بازیکن *"
                    options={studentChips}
                    value={selectedStudentId}
                    onChange={(val: any) => {
                        setSelectedStudentId(val);
                        if (errors.student) setErrors({ ...errors, student: '' });
                    }}
                />

                <TextField
                    label="نام حریف *"
                    placeholder="مثال: آرمان مرادی"
                    value={opponentName}
                    onChangeText={setOpponentName}
                    error={errors.opponent}
                    icon="account-outline"
                />

                <Chips
                    label="نوع مسابقه"
                    options={[
                        { value: 'singles', label: 'انفرادی (Singles)' },
                        { value: 'doubles', label: 'دوبل (Doubles)' },
                    ]}
                    value={matchType}
                    onChange={(val: any) => setMatchType(val)}
                />

                <TextField
                    label="محل برگزاری (کورت / باشگاه)"
                    placeholder="مثال: آکادمی تنیس استقلال - زمین ۱"
                    value={location}
                    onChangeText={setLocation}
                    icon="map-marker-outline"
                />

                <TextField
                    label="یادداشت‌های قبل از بازی"
                    placeholder="استراتژی بازی یا نکات کلیدی..."
                    value={notes}
                    onChangeText={setNotes}
                    icon="note-text-outline"
                    multiline
                    numberOfLines={3}
                />

                <View style={styles.buttonContainer}>
                    <Button
                        title="شروع و ثبت زنده مسابقه"
                        onPress={handleSubmit}
                        variant="navy"
                        icon="tennis"
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
