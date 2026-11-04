import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export interface AnalysisRecord {
    id: number;
    match_id: number;
    markdown_report: string;
    statistics: any;
    match_info: any;
    model_used: string;
    created_at: string;
}

export const analysisService = {
    /**
     * Analyze match with AI and SAVE to database
     */
    analyzeMatch: async (matchId: number) => {
        const aiApi = axios.create({
            baseURL: API_BASE_URL,
            timeout: 180000,
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await aiApi.post(`/matches/${matchId}/analyze`);
        return response.data;
    },

    /**
     * Get the latest saved analysis (without AI call)
     */
    getLatestAnalysis: async (matchId: number) => {
        const response = await axios.get(`${API_BASE_URL}/matches/${matchId}/analysis/latest`);
        return response.data;
    },

    /**
     * Get all analyses for a match (history)
     */
    getAllAnalyses: async (matchId: number): Promise<{
        success: boolean;
        analyses: AnalysisRecord[];
        total: number;
    }> => {
        const response = await axios.get(`${API_BASE_URL}/matches/${matchId}/analyses`);
        return response.data;
    },

    getStatistics: async (matchId: number) => {
        const response = await axios.get(`${API_BASE_URL}/matches/${matchId}/statistics`);
        return response.data;
    },
};