import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { CoachWallet, SettlementRequest, WalletTransaction } from '@/shared/types/api';

export function useWallet() {
  return useQuery<CoachWallet>({
    queryKey: ['wallet'],
    queryFn: async () => (await api.get<CoachWallet>('/wallet')).data,
  });
}

export function useSettlements() {
  return useQuery<SettlementRequest[]>({
    queryKey: ['wallet', 'settlements'],
    queryFn: async () => (await api.get<SettlementRequest[]>('/wallet/settlements')).data,
  });
}

export function useWalletTransactions() {
  return useQuery<WalletTransaction[]>({
    queryKey: ['wallet', 'transactions'],
    queryFn: async () => (await api.get<WalletTransaction[]>('/wallet/transactions')).data,
  });
}

export function useRequestSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; iban?: string; account_holder?: string }) =>
      (await api.post<SettlementRequest>('/wallet/settle', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
