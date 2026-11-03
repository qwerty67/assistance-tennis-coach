import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface PilotMatch {
  id: string;
  coach_id: string;
  student_id: string;
  student_name?: string;
  opponent_name: string;
  match_date: string;
  location?: string | null;
  match_type: 'singles' | 'doubles';
  notes?: string | null;
  status: 'ongoing' | 'completed' | 'abandoned';
  sets_score?: string | null;
  final_result?: 'win' | 'loss' | 'draw' | null;
  created_at: string;
}

export function usePilotMatches(statusFilter?: string) {
  return useQuery<PilotMatch[]>({
    queryKey: ['pilot-matches', statusFilter],
    queryFn: async () => {
      const p = statusFilter ? ?status_filter= : '';
      return (await api.get<PilotMatch[]>(/tennis-pilot/matches)).data;
    },
  });
}

export function useCreatePilotMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      student_id: string;
      opponent_name: string;
      match_date: string;
      location?: string;
      match_type?: 'singles' | 'doubles';
      notes?: string;
    }) => (await api.post<PilotMatch>('/tennis-pilot/matches', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pilot-matches'] });
    },
  });
}
