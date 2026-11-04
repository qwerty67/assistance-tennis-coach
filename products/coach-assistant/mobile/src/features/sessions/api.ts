import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { invalidateOperational, qk } from '@/shared/services/queryClient';
import type { Makeup, Session, SessionDetail } from '@/shared/types/api';

export interface SessionFilters { date_from?: string; date_to?: string; class_id?: string; student_id?: string; status?: string }
export interface SessionInput { class_id: string; term_id?: string | null; start_at: string; end_at: string; location?: string | null; notes?: string | null }

export const sessionsApi = {
  list: (f: SessionFilters) => api.get<Session[]>('/sessions', f),
  get: (id: string) => api.get<SessionDetail>(`/sessions/${id}`),
  create: (b: SessionInput) => api.post<Session>('/sessions', b),
  update: (id: string, b: { start_at?: string; end_at?: string; notes?: string; location?: string; reason?: string; version?: number }) => api.put<Session>(`/sessions/${id}`, b),
  cancel: (id: string, reason?: string) => api.post<Session & { makeup_suggestion?: string }>(`/sessions/${id}/cancel`, { reason, suggest_makeup: true }),
  restore: (id: string) => api.post<Session>(`/sessions/${id}/restore`),
  remove: (id: string) => api.delete(`/sessions/${id}`),
  makeup: (id: string, b: { start_at: string; end_at: string; student_id?: string | null; makeup_id?: string | null }) => api.post<Session>(`/sessions/${id}/makeup`, b),
  makeupSuggestions: (id: string) => api.get<{ start_at: string; end_at: string }[]>(`/sessions/${id}/makeup-suggestions`),
  makeups: () => api.get<Makeup[]>('/makeups'),
  dismissMakeup: (id: string) => api.post(`/makeups/${id}/dismiss`),
};

export const useSessions = (f: SessionFilters, enabled = true) => useQuery({ queryKey: qk.sessions(f), queryFn: () => sessionsApi.list(f), enabled });
export const useSession = (id: string) => useQuery({ queryKey: qk.session(id), queryFn: () => sessionsApi.get(id), enabled: !!id });
export const useMakeups = () => useQuery({ queryKey: qk.makeups, queryFn: sessionsApi.makeups });
export const useMakeupSuggestions = (id: string, enabled: boolean) =>
  useQuery({ queryKey: ['session', id, 'suggestions'], queryFn: () => sessionsApi.makeupSuggestions(id), enabled });

const opts = { onSuccess: invalidateOperational };
export const useCreateSession = () => useMutation({ mutationFn: sessionsApi.create, ...opts });
export const useUpdateSession = (id: string) => useMutation({ mutationFn: (b: Parameters<typeof sessionsApi.update>[1]) => sessionsApi.update(id, b), ...opts });
export const useCancelSession = (id: string) => useMutation({ mutationFn: (reason?: string) => sessionsApi.cancel(id, reason), ...opts });
export const useRestoreSession = (id: string) => useMutation({ mutationFn: () => sessionsApi.restore(id), ...opts });
export const useDeleteSession = () => useMutation({ mutationFn: sessionsApi.remove, ...opts });
export const useCreateMakeup = (id: string) => useMutation({ mutationFn: (b: Parameters<typeof sessionsApi.makeup>[1]) => sessionsApi.makeup(id, b), ...opts });
export const useDismissMakeup = () => useMutation({ mutationFn: sessionsApi.dismissMakeup, ...opts });
