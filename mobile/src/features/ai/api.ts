import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { AITrainingPlanResponse, AIStudentAnalysisResponse } from '@/shared/types/api';

export function useGenerateAITrainingPlan() {
  return useMutation({
    mutationFn: async (payload: {
      level: string;
      goal: string;
      duration_weeks?: number;
      sessions_per_week?: number;
      focus_areas?: string[];
    }) => (await api.post<AITrainingPlanResponse>('/ai/generate-training-plan', payload)).data,
  });
}

export function useAnalyzeStudentAI() {
  return useMutation({
    mutationFn: async (studentId: string) =>
      (await api.post<AIStudentAnalysisResponse>('/ai/analyze-student', { student_id: studentId })).data,
  });
}
