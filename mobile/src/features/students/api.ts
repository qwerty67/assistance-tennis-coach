import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { invalidateOperational, qk, queryClient } from '@/shared/services/queryClient';
import type { AccountDetail, Student, StudentDetail } from '@/shared/types/api';

export interface StudentFilters { q?: string; status?: string; level?: string; financial_status?: string }
export type StudentInput = Partial<Omit<Student, 'id' | 'has_account' | 'account' | 'created_at'>>;

export const studentsApi = {
  list: (f: StudentFilters) => api.get<Student[]>('/students', f),
  get: (id: string) => api.get<StudentDetail>(`/students/${id}`),
  account: (id: string) => api.get<AccountDetail>(`/students/${id}/account`),
  create: (b: StudentInput) => api.post<Student>('/students', b),
  update: (id: string, b: StudentInput) => api.put<Student>(`/students/${id}`, b),
  deactivate: (id: string) => api.post<Student>(`/students/${id}/deactivate`),
  activate: (id: string) => api.post<Student>(`/students/${id}/activate`),
  remove: (id: string) => api.delete(`/students/${id}`),
};

export const useStudents = (f: StudentFilters = {}) => useQuery({ queryKey: qk.students(f), queryFn: () => studentsApi.list(f) });
export const useStudent = (id: string) => useQuery({ queryKey: qk.student(id), queryFn: () => studentsApi.get(id), enabled: !!id });
export const useStudentAccount = (id: string) => useQuery({ queryKey: qk.studentAccount(id), queryFn: () => studentsApi.account(id), enabled: !!id });

const refresh = () => {
  queryClient.invalidateQueries({ queryKey: ['students'] });
  return invalidateOperational();
};
export const useSaveStudent = (id?: string) =>
  useMutation({ mutationFn: (b: StudentInput) => (id ? studentsApi.update(id, b) : studentsApi.create(b)), onSuccess: refresh });
export const useStudentStatus = (id: string) =>
  useMutation({ mutationFn: (active: boolean) => (active ? studentsApi.activate(id) : studentsApi.deactivate(id)), onSuccess: refresh });
export const useDeleteStudent = () => useMutation({ mutationFn: studentsApi.remove, onSuccess: refresh });
