import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { invalidateOperational, qk, queryClient } from '@/shared/services/queryClient';
import type { BillingMode, ClassType, PaymentPlan, SlotInput, TennisClass, Term, TermType } from '@/shared/types/api';

export interface ClassInput {
  name: string; class_type: ClassType; capacity_min: number; capacity_max: number; duration_minutes: number;
  session_price: number; court_cost: number; coach_income?: number | null; monthly_fee: number; billing_mode?: BillingMode | null;
  location?: string | null; description?: string | null; member_ids?: string[]; color?: string | null;
}
export interface TermInput {
  class_id: string; title: string; term_type: TermType; total_sessions?: number | null; start_date: string; end_date?: string | null;
  session_price?: number | null; court_cost?: number | null; monthly_fee?: number | null; billing_mode?: BillingMode | null;
  payer_student_id?: string | null; payment_plan: PaymentPlan; installments_count?: number;
  members?: { student_id: string; share_per_session?: number | null }[];
  schedule?: { schedule_type: 'recurring' | 'custom'; slots: SlotInput[]; start_date?: string; end_date?: string | null } | null;
  notes?: string | null;
}

export const classesApi = {
  list: (f?: object) => api.get<TennisClass[]>('/classes', f),
  get: (id: string) => api.get<TennisClass>(`/classes/${id}`),
  create: (b: ClassInput) => api.post<TennisClass>('/classes', b),
  update: (id: string, b: Partial<ClassInput> & { is_active?: boolean }) => api.put<TennisClass>(`/classes/${id}`, b),
  remove: (id: string) => api.delete(`/classes/${id}`),
  addMember: (id: string, sid: string) => api.post<TennisClass>(`/classes/${id}/members/${sid}`),
  removeMember: (id: string, sid: string) => api.delete<TennisClass>(`/classes/${id}/members/${sid}`),
  terms: (f?: object) => api.get<Term[]>('/terms', f),
  term: (id: string) => api.get<Term>(`/terms/${id}`),
  createTerm: (b: TermInput) => api.post<Term>('/terms', b),
  updateTerm: (id: string, b: object) => api.put<Term>(`/terms/${id}`, b),
  deleteTerm: (id: string) => api.delete(`/terms/${id}`),
  updateShare: (id: string, sid: string, share: number) => api.put<Term>(`/terms/${id}/members/${sid}/share`, { share_per_session: share }),
  monthlyCharges: (id: string, period: string) => api.post<{ created: number }>(`/terms/${id}/monthly-charges`, { period }),
};

export const useClasses = (f: object = {}) => useQuery({ queryKey: qk.classes(f), queryFn: () => classesApi.list(f) });
export const useClass = (id: string) => useQuery({ queryKey: qk.class(id), queryFn: () => classesApi.get(id), enabled: !!id });
export const useTerms = (f: object = {}) => useQuery({ queryKey: qk.terms(f), queryFn: () => classesApi.terms(f) });
export const useTerm = (id: string) => useQuery({ queryKey: qk.term(id), queryFn: () => classesApi.term(id), enabled: !!id });

const refresh = () => {
  queryClient.invalidateQueries({ queryKey: ['classes'] });
  queryClient.invalidateQueries({ queryKey: ['class'] });
  return invalidateOperational();
};
export const useSaveClass = (id?: string) =>
  useMutation({ mutationFn: (b: ClassInput) => (id ? classesApi.update(id, b) : classesApi.create(b)), onSuccess: refresh });
export const useDeleteClass = () => useMutation({ mutationFn: classesApi.remove, onSuccess: refresh });
export const useClassMember = (id: string) =>
  useMutation({ mutationFn: ({ sid, add }: { sid: string; add: boolean }) => (add ? classesApi.addMember(id, sid) : classesApi.removeMember(id, sid)), onSuccess: refresh });
export const useCreateTerm = () => useMutation({ mutationFn: classesApi.createTerm, onSuccess: refresh });
export const useUpdateShare = (termId: string) =>
  useMutation({ mutationFn: ({ sid, share }: { sid: string; share: number }) => classesApi.updateShare(termId, sid, share), onSuccess: refresh });
export const useDeleteTerm = () => useMutation({ mutationFn: classesApi.deleteTerm, onSuccess: refresh });
export const useMonthlyCharges = (termId: string) => useMutation({ mutationFn: (period: string) => classesApi.monthlyCharges(termId, period), onSuccess: refresh });
