import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
    AppText,
    Chips,
    EmptyState,
    Fab,
    Header,
    Screen,
    SkeletonList,
    TextField,
} from '@tennis-platform/design-system';
import { spacing } from '@tennis-platform/design-system';
import { digits } from '@tennis-platform/shared-utils';
import { StudentCard } from '../components/match/StudentCard';
import { ConfirmationDialog } from '../components/common';
import { studentService } from '../services/studentService';
import { useToast } from '../context/ToastContext';
import { Student } from '../types';

type FilterType = 'all' | 'withMatches';

export default function StudentsScreen({ navigation }: any) {
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const toast = useToast();

    const loadStudents = async () => {
        try {
            const data = await studentService.getAll();
            setStudents(data);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadStudents();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadStudents();
    }, []);

    const handleDeletePress = (student: Student) => {
        setStudentToDelete(student);
        setDeleteDialogVisible(true);
    };

    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;
        try {
            await studentService.delete(studentToDelete.id);
            toast.success(`${studentToDelete.name} با موفقیت حذف شد`);
            await loadStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            toast.error('خطا در حذف شاگرد');
        } finally {
            setDeleteDialogVisible(false);
            setStudentToDelete(null);
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const matchSearch =
                !search.trim() ||
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                (s.phone && s.phone.includes(search));
            if (!matchSearch) return false;
            if (filter === 'withMatches') return (s.total_matches || 0) > 0;
            return true;
        });
    }, [students, search, filter]);

    const header = (
        <Header
            title="شاگردان و بازیکنان"
            subtitle={`${digits(filteredStudents.length)} شاگرد`}
            large
        />
    );

    return (
        <Screen
            scroll={false}
            padded={false}
            header={header}
            overlay={
                <Fab
                    icon="account-plus"
                    label="شاگرد جدید"
                    onPress={() => navigation.navigate('AddStudent')}
                />
            }
        >
            <View style={styles.filterSection}>
                <TextField
                    icon="magnify"
                    placeholder="جستجوی نام یا شماره شاگرد..."
                    value={search}
                    onChangeText={setSearch}
                />
                <Chips
                    size="sm"
                    value={filter}
                    onChange={(v: any) => setFilter(v)}
                    options={[
                        { value: 'all', label: 'همه شاگردان' },
                        { value: 'withMatches', label: 'دارای مسابقه' },
                    ]}
                />
            </View>

            {loading ? (
                <View style={{ paddingHorizontal: spacing.lg }}>
                    <SkeletonList rows={4} />
                </View>
            ) : (
                <FlatList
                    data={filteredStudents}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    renderItem={({ item, index }) => (
                        <StudentCard
                            student={item}
                            index={index}
                            onPress={() => navigation.navigate('StudentDetails', { studentId: item.id })}
                            onDelete={() => handleDeletePress(item)}
                        />
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon="account-search-outline"
                            title="شاگردی یافت نشد"
                            description={
                                search.trim()
                                    ? 'شاگردی با این مشخصات پیدا نشد.'
                                    : 'اولین شاگرد خود را اضافه کنید.'
                            }
                            actionLabel="افزودن شاگرد جدید"
                            onAction={() => navigation.navigate('AddStudent')}
                        />
                    }
                />
            )}

            <ConfirmationDialog
                visible={deleteDialogVisible}
                title="حذف شاگرد"
                message={`آیا از حذف «${studentToDelete?.name}» اطمینان دارید؟ تمام سوابق و مسابقات وی نیز حذف خواهند شد.`}
                icon="alert-circle"
                onDismiss={() => setDeleteDialogVisible(false)}
                actions={[
                    {
                        label: 'انصراف',
                        onPress: () => setDeleteDialogVisible(false),
                        variant: 'cancel',
                    },
                    {
                        label: 'حذف شاگرد',
                        onPress: handleDeleteConfirm,
                        variant: 'destructive',
                    },
                ]}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    filterSection: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        paddingBottom: spacing.sm,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        paddingBottom: 130,
    },
});
