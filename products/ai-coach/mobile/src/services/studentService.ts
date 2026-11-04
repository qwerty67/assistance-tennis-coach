import api from './api';
import { Student, StudentCreate, StudentUpdate } from '../types';

export const studentService = {
    // Get all students
    getAll: async (): Promise<Student[]> => {
        try {
            const response = await api.get('/students/');
            if (Array.isArray(response.data)) {
                return response.data.map((s: any) => ({
                    ...s,
                    name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'شاگرد',
                }));
            }
            console.warn('API did not return an array:', response.data);
            return [];
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    },

    // Get student by ID
    getById: async (id: string | number): Promise<Student> => {
        const response = await api.get(`/students/${id}`);
        const s = response.data;
        return {
            ...s,
            name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'شاگرد',
        };
    },

    // Create student
    create: async (data: StudentCreate): Promise<Student> => {
        const payload: any = { ...data };
        if (data.name && !data.first_name) {
            const parts = data.name.trim().split(' ');
            payload.first_name = parts[0] || 'شاگرد';
            payload.last_name = parts.slice(1).join(' ') || '';
        }
        const response = await api.post('/students/', payload);
        const s = response.data;
        return {
            ...s,
            name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'شاگرد',
        };
    },

    // Update student
    update: async (id: string | number, data: StudentUpdate): Promise<Student> => {
        const payload: any = { ...data };
        if (data.name && !data.first_name) {
            const parts = data.name.trim().split(' ');
            payload.first_name = parts[0] || '';
            payload.last_name = parts.slice(1).join(' ') || '';
        }
        const response = await api.put(`/students/${id}`, payload);
        const s = response.data;
        return {
            ...s,
            name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'شاگرد',
        };
    },

    // Delete student
    delete: async (id: string | number): Promise<void> => {
        await api.delete(`/students/${id}`);
    },

    getWithStats: async (id: string | number): Promise<any> => {
        const response = await api.get(`/students/${id}/details`);
        return response.data;
    },
};

export default studentService;
