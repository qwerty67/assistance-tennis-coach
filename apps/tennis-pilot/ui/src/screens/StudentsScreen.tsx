import React, { useState, useCallback } from 'react';
import {View, FlatList, StyleSheet, RefreshControl, ScrollView} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StudentCard } from '../components/match';
import { LoadingScreen, EmptyState } from '../components/common';
import { studentService } from '../services/studentService';
import { Student } from '../types';
import { COLORS, SPACING } from '../theme';
import { CustomHeader } from '../components/common';
interface StudentsScreenProps {
    navigation: any;
}
import { useToast } from '../context/ToastContext';
import { ConfirmationDialog } from '../components/common';
import { SkeletonCard } from '../components/common';
import {useTheme} from "../context/ThemeContext";

const StudentsScreen: React.FC<StudentsScreenProps> = ({ navigation }) => {
    const { colors } = useTheme();
    const [students, setStudents] = useState<Student[]>([]);
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
            toast.success(`${studentToDelete.name} deleted`);
            await loadStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            toast.error('Failed to delete student');
        } finally {
            setDeleteDialogVisible(false);
            setStudentToDelete(null);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await studentService.delete(id);
            toast.success('Student deleted');
            await loadStudents();
        } catch (error) {
            toast.error('Failed to delete student');
            console.error('Error deleting student:', error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <CustomHeader title="شاگردان" />
                <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </ScrollView>
            </View>
        );
    }

    // ... بقیه کد همان است ...

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/*<CustomHeader*/}
            {/*    title="داشبورد"*/}
            {/*    showThemeToggle={true} // ✅ اضافه کردن toggle به هدر*/}
            {/*/>*/}
            <CustomHeader
                title="Students"
                subtitle={`${students.length} players`}
                showThemeToggle={true}
                rightAction={{
                    icon: 'plus',
                    onPress: () => navigation.navigate('AddStudent'),
                }}
            />

            {students.length === 0 ? (
                <EmptyState
                    icon="account-group"
                    title="No Students Yet"
                    message="Add your first student to get started"
                    actionLabel="Add Student"
                    onAction={() => navigation.navigate('AddStudent')}
                />
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <StudentCard
                            student={item}
                            onDelete={() => handleDeletePress(item)}
                            onPress={() => navigation.navigate('StudentDetails', { studentId: item.id })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                />
            )}
            {/* Confirmation Dialog */}
            <ConfirmationDialog
                visible={deleteDialogVisible}
                title="Delete Student"
                message={`Are you sure you want to delete ${studentToDelete?.name}? This will also delete all their matches and cannot be undone.`}
                icon="alert-circle"
                iconColor={colors.error}
                onDismiss={() => setDeleteDialogVisible(false)}
                actions={[
                    {
                        label: 'Cancel',
                        onPress: () => setDeleteDialogVisible(false),
                        variant: 'cancel',
                    },
                    {
                        label: 'Delete',
                        onPress: handleDeleteConfirm,
                        variant: 'destructive',
                        icon: 'delete',
                    },
                ]}
            />
        </View>
    );
};

// ... styles همان است ...

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        padding: SPACING.lg,
    },
    scroll: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg,
    }
});

// ✅ مهم: default export
export default StudentsScreen;