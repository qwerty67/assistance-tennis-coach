import api, {authService} from './authService';
import { Student, StudentCreate, StudentUpdate } from '../types';

export const studentService = {
    // Get all students
    getAll: async (): Promise<Student[]> => {
        // return await api.get('/students');
        try {
            const response = await api.get('/students/');
            // ✅ بررسی اینکه پاسخ آرایه است
            if (Array.isArray(response.data)) {
                return response.data;
            }
            console.warn('API did not return an array:', response.data);
            return [];
        } catch (error) {
            console.error('Error fetching matches:', error);
            return []; // برگرداندن آرایه خالی به جای throw
        }
    },

    // Get student by ID
    getById: async (id: number): Promise<Student> => {
        return await api.get(`/students/${id}`);
    },

    // Create student
    create: async (data: StudentCreate): Promise<Student> => {
        return await api.post('/students/', data);
    },

    // Update student
    update: async (id: number, data: StudentUpdate): Promise<Student> => {
        return await api.put(`/students/${id}`, data);
    },

    // Delete student
    delete: async (id: number): Promise<void> => {
        return await api.delete(`/students/${id}`);
    },

    getWithStats: async (id: number): Promise<any> => {
        return await api.get(`/students/${id}/details`);
    },
};