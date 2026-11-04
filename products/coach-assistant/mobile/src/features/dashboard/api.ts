import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { qk } from '@/shared/services/queryClient';
import type { CoachDashboard, StudentDashboard } from '@/shared/types/api';

export const useCoachDashboard = () => useQuery({ queryKey: qk.coachDashboard, queryFn: () => api.get<CoachDashboard>('/dashboard/coach') });
export const useStudentDashboard = () => useQuery({ queryKey: qk.studentDashboard, queryFn: () => api.get<StudentDashboard>('/me/dashboard') });
