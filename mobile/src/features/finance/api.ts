import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { invalidateOperational, qk } from '@/shared/services/queryClient';
import type { AccountDetail, Charge, FinancialSummary, Payment, PaymentMethod } from '@/shared/types/api';

export interface PaymentInput { student_id: string; amount: number; paid_at: string; method: PaymentMethod; description?: string | null; term_id?: string | null; class_id?: string | null; reference_no?: string | null }

export const financeApi = {
  summary: (months = 6) => api.get<FinancialSummary>('/financial-summary', { months }),
  payments: (f?: object) => api.get<Payment[]>('/payments', f),
  createPayment: (b: PaymentInput) => api.post<Payment>('/payments', b),
  voidPayment: (id: string) => api.delete(`/payments/${id}`),
  charges: (f?: object) => api.get<Charge[]>('/charges', f),
  createCharge: (b: { student_id: string; amount: number; due_date?: string; description?: string }) => api.post<Charge>('/charges', b),
  voidCharge: (id: string) => api.delete(`/charges/${id}`),
  myAccounts: () => api.get<AccountDetail[]>('/me/accounts'),
};

export const useFinanceSummary = (months = 6) => useQuery({ queryKey: qk.financeSummary({ months }), queryFn: () => financeApi.summary(months) });
export const usePayments = (f: object = {}) => useQuery({ queryKey: qk.payments(f), queryFn: () => financeApi.payments(f) });
export const useCharges = (f: object = {}) => useQuery({ queryKey: qk.charges(f), queryFn: () => financeApi.charges(f) });
export const useMyAccounts = () => useQuery({ queryKey: qk.myAccounts, queryFn: financeApi.myAccounts });
export const useCreatePayment = () => useMutation({ mutationFn: financeApi.createPayment, onSuccess: invalidateOperational });
export const useVoidPayment = () => useMutation({ mutationFn: financeApi.voidPayment, onSuccess: invalidateOperational });
export const useCreateCharge = () => useMutation({ mutationFn: financeApi.createCharge, onSuccess: invalidateOperational });
export const useVoidCharge = () => useMutation({ mutationFn: financeApi.voidCharge, onSuccess: invalidateOperational });
