import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { qk, queryClient } from '@/shared/services/queryClient';
import type { CoachSettings } from '@/shared/types/api';

export const useCoachSettings = () => useQuery({ queryKey: qk.settings, queryFn: () => api.get<CoachSettings>('/coach/settings') });
export const useSaveSettings = () =>
  useMutation({ mutationFn: (b: Partial<CoachSettings>) => api.put<CoachSettings>('/coach/settings', b), onSuccess: (d) => queryClient.setQueryData(qk.settings, d) });
export const useChangePassword = () =>
  useMutation({ mutationFn: (b: { current_password: string; new_password: string }) => api.post('/auth/change-password', b) });
