import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { qk, queryClient } from '@/shared/services/queryClient';
import type { Exercise, TrainingPlan } from '@/shared/types/api';

export type ExerciseInput = Omit<Exercise, 'id' | 'completed_at'>;
export interface PlanInput { student_id: string; title: string; description?: string | null; start_date?: string | null; end_date?: string | null; exercises?: ExerciseInput[] }

export const trainingApi = {
  catalog: () => api.get<Record<string, string[]>>('/training-plans/catalog'),
  list: (f?: object) => api.get<TrainingPlan[]>('/training-plans', f),
  get: (id: string) => api.get<TrainingPlan>(`/training-plans/${id}`),
  create: (b: PlanInput) => api.post<TrainingPlan>('/training-plans', b),
  update: (id: string, b: Partial<PlanInput> & { status?: string }) => api.put<TrainingPlan>(`/training-plans/${id}`, b),
  remove: (id: string) => api.delete(`/training-plans/${id}`),
  addExercise: (id: string, b: ExerciseInput) => api.post<TrainingPlan>(`/training-plans/${id}/exercises`, b),
  updateExercise: (id: string, eid: string, b: Partial<ExerciseInput>) => api.patch<TrainingPlan>(`/training-plans/${id}/exercises/${eid}`, b),
  deleteExercise: (id: string, eid: string) => api.delete<TrainingPlan>(`/training-plans/${id}/exercises/${eid}`),
};

export const usePlans = (f: object = {}) => useQuery({ queryKey: qk.plans(f), queryFn: () => trainingApi.list(f) });
export const usePlan = (id: string) => useQuery({ queryKey: qk.plan(id), queryFn: () => trainingApi.get(id), enabled: !!id });
export const useCatalog = () => useQuery({ queryKey: ['training', 'catalog'], queryFn: trainingApi.catalog, staleTime: Infinity });

const refresh = (p?: TrainingPlan) => {
  if (p) queryClient.setQueryData(qk.plan(p.id), p);
  queryClient.invalidateQueries({ queryKey: ['plans'] });
  queryClient.invalidateQueries({ queryKey: ['student'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};
export const useCreatePlan = () => useMutation({ mutationFn: trainingApi.create, onSuccess: refresh });
export const useDeletePlan = () => useMutation({ mutationFn: trainingApi.remove, onSuccess: () => refresh() });
export const useAddExercise = (id: string) => useMutation({ mutationFn: (b: ExerciseInput) => trainingApi.addExercise(id, b), onSuccess: refresh });
export const useUpdateExercise = (id: string) =>
  useMutation({ mutationFn: ({ eid, body }: { eid: string; body: Partial<ExerciseInput> }) => trainingApi.updateExercise(id, eid, body), onSuccess: refresh });
export const useDeleteExercise = (id: string) => useMutation({ mutationFn: (eid: string) => trainingApi.deleteExercise(id, eid), onSuccess: refresh });
