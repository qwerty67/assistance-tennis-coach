import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { invalidateOperational, qk, queryClient } from '@/shared/services/queryClient';
import type {
  CoachInvitation, CoachInvitationPreview, FinancialAccountDetail, Student, StudentCoach, StudentDetail,
} from '@/shared/types/api';

export interface StudentFilters { q?: string; status?: string; level?: string; financial_status?: string }
export type StudentInput = Partial<Omit<Student, 'id' | 'has_account' | 'account' | 'created_at'>> & {
  with_invitation?: boolean;
  invitation_channel?: string;
};

export const studentsApi = {
  list: (f: StudentFilters) => api.get<Student[]>('/students', f),
  get: (id: string) => api.get<StudentDetail>(`/students/${id}`),
  account: (id: string) => api.get<FinancialAccountDetail>(`/students/${id}/account`),
  create: (b: StudentInput) => api.post<Student>('/students', b),
  update: (id: string, b: StudentInput) => api.put<Student>(`/students/${id}`, b),
  deactivate: (id: string) => api.post<Student>(`/students/${id}/deactivate`),
  activate: (id: string) => api.post<Student>(`/students/${id}/activate`),
  disconnect: (id: string) => api.post<Student>(`/students/${id}/disconnect`),
  reconnect: (id: string) => api.post<Student>(`/students/${id}/reconnect`),
  remove: (id: string) => api.delete(`/students/${id}`),

  // Invitations
  getInvitation: (studentId: string) => api.get<CoachInvitation | null>(`/invitations/student/${studentId}`),
  createInvitation: (b: { student_id?: string; phone?: string; channel?: string; expires_in_days?: number }) =>
    api.post<CoachInvitation>('/invitations', b),
  cancelInvitation: (id: string) => api.post(`/invitations/${id}/cancel`),
  previewInvitation: (code: string) => api.get<CoachInvitationPreview>(`/invitations/preview?code=${encodeURIComponent(code)}`),
  acceptInvitation: (b: { code: string; set_as_primary?: boolean }) => api.post<{ message: string; coach_id: string; is_primary: boolean }>('/invitations/accept', b),

  // Student coach management
  myCoaches: () => api.get<StudentCoach[]>('/me/coaches'),
  setPrimaryCoach: (coachId: string) => api.post(`/me/coaches/${coachId}/primary`),
  respondCoach: (coachId: string, accept: boolean) => api.post(`/me/coaches/${coachId}/respond?accept=${accept}`),
  disconnectCoach: (coachId: string) => api.post(`/me/coaches/${coachId}/disconnect`),
};

export const useStudents = (f: StudentFilters = {}) => useQuery({ queryKey: qk.students(f), queryFn: () => studentsApi.list(f) });
export const useStudent = (id: string) => useQuery({ queryKey: qk.student(id), queryFn: () => studentsApi.get(id), enabled: !!id });
export const useStudentAccount = (id: string) => useQuery({ queryKey: qk.studentAccount(id), queryFn: () => studentsApi.account(id), enabled: !!id });

const refresh = () => {
  queryClient.invalidateQueries({ queryKey: ['students'] });
  queryClient.invalidateQueries({ queryKey: ['coaches'] });
  return invalidateOperational();
};

export const useSaveStudent = (id?: string) =>
  useMutation({ mutationFn: (b: StudentInput) => (id ? studentsApi.update(id, b) : studentsApi.create(b)), onSuccess: refresh });
export const useStudentStatus = (id: string) =>
  useMutation({ mutationFn: (active: boolean) => (active ? studentsApi.activate(id) : studentsApi.deactivate(id)), onSuccess: refresh });
export const useDisconnectStudent = () =>
  useMutation({ mutationFn: (id: string) => studentsApi.disconnect(id), onSuccess: refresh });
export const useReconnectStudent = () =>
  useMutation({ mutationFn: (id: string) => studentsApi.reconnect(id), onSuccess: refresh });
export const useDeleteStudent = () => useMutation({ mutationFn: studentsApi.remove, onSuccess: refresh });

// Invitations & Student Coach Management hooks
export const useStudentInvitation = (studentId: string) =>
  useQuery({ queryKey: ['invitation', studentId], queryFn: () => studentsApi.getInvitation(studentId), enabled: !!studentId });

export const useCreateInvitation = () =>
  useMutation({
    mutationFn: studentsApi.createInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitation'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

export const useCancelInvitation = () =>
  useMutation({
    mutationFn: studentsApi.cancelInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitation'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

export const usePreviewInvitation = (code: string, enabled = true) =>
  useQuery({
    queryKey: ['invitation_preview', code],
    queryFn: () => studentsApi.previewInvitation(code),
    enabled: enabled && !!code && code.trim().length >= 3,
    retry: false,
  });

export const useAcceptInvitation = () =>
  useMutation({
    mutationFn: studentsApi.acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return invalidateOperational();
    },
  });

export const useMyCoaches = () =>
  useQuery({ queryKey: ['coaches', 'my'], queryFn: studentsApi.myCoaches });

export const useSetPrimaryCoach = () =>
  useMutation({
    mutationFn: studentsApi.setPrimaryCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return invalidateOperational();
    },
  });

export const useRespondCoach = () =>
  useMutation({
    mutationFn: ({ coachId, accept }: { coachId: string; accept: boolean }) =>
      studentsApi.respondCoach(coachId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return invalidateOperational();
    },
  });

export const useDisconnectCoach = () =>
  useMutation({
    mutationFn: studentsApi.disconnectCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return invalidateOperational();
    },
  });
