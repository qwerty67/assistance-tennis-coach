import api from './api';
import { Match, MatchCreate, MatchComplete, Point, PointCreate } from '../types';

export const matchService = {
    // Get all matches
    getAll: async (filters?: Record<string, any>): Promise<Match[]> => {
        try {
            const response = await api.get('/matches/');
            if (Array.isArray(response.data)) {
                return response.data;
            }
            console.warn('API did not return an array:', response.data);
            return [];
        } catch (error) {
            console.error('Error fetching matches:', error);
            return [];
        }
    },

    // Get match by ID
    getById: async (id: number | string): Promise<Match> => {
        const response = await api.get(`/matches/${id}`);
        return response.data;
    },

    // Create match
    create: async (data: MatchCreate): Promise<Match> => {
        const response = await api.post('/matches/', data);
        return response.data;
    },

    // Delete match
    delete: async (id: number | string): Promise<void> => {
        await api.delete(`/matches/${id}`);
    },

    // Complete match
    complete: async (id: number | string, data: MatchComplete): Promise<Match> => {
        const response = await api.post(`/matches/${id}/complete`, data);
        return response.data;
    },

    // Get match points
    getPoints: async (matchId: number | string): Promise<Point[]> => {
        const response = await api.get(`/matches/${matchId}/points`);
        return Array.isArray(response.data) ? response.data : [];
    },

    // Create point
    createPoint: async (matchId: number | string, data: PointCreate): Promise<Point> => {
        const response = await api.post(`/matches/${matchId}/points`, data);
        return response.data;
    },

    // Delete point
    deletePoint: async (matchId: number | string, pointId: number | string): Promise<void> => {
        await api.delete(`/matches/${matchId}/points/${pointId}`);
    },
};

export default matchService;
