import api from './api';
import { Match, MatchCreate, MatchComplete, Point, PointCreate } from '../types';

export const matchService = {
    // Get all matches
    getAll: async (filters?: Record<string, any>): Promise<Match[]> => {
        // const params = new URLSearchParams(filters || {}).toString();
        // return await api.get(`/matches${params ? '?' + params : ''}`);
        try {
            const response = await api.get('/matches/');
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

    // Get match by ID
    getById: async (id: number): Promise<Match> => {
        return await api.get(`/matches/${id}`);
    },

    // Create match
    create: async (data: MatchCreate): Promise<Match> => {
        return await api.post('/matches/', data);
    },

    // Delete match
    delete: async (id: number): Promise<void> => {
        return await api.delete(`/matches/${id}`);
    },

    // Complete match
    complete: async (id: number, data: MatchComplete): Promise<Match> => {
        return await api.post(`/matches/${id}/complete`, data);
    },

    // Get match points
    getPoints: async (matchId: number): Promise<Point[]> => {
        const response = await api.get(`/matches/${matchId}/points`);
        return Array.isArray(response.data) ? response.data : [];
    },

    // Create point
    createPoint: async (matchId: number, data: PointCreate): Promise<Point> => {
        return await api.post(`/matches/${matchId}/points`, data);
    },

    // Delete point
    deletePoint: async (matchId: number, pointId: number): Promise<void> => {
        return await api.delete(`/matches/${matchId}/points/${pointId}`);
    },
};