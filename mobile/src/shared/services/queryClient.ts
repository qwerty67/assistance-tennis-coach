import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './apiClient';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, err) => !(err instanceof ApiError && err.status && err.status < 500) && count < 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

/** Central query keys – keeps cache invalidation consistent across features. */
export const qk = {
  me: ['me'] as const,
  coachDashboard: ['dashboard', 'coach'] as const,
  studentDashboard: ['dashboard', 'student'] as const,
  students: (f?: object) => ['students', f ?? {}] as const,
  student: (id: string) => ['student', id] as const,
  studentAccount: (id: string) => ['student', id, 'account'] as const,
  classes: (f?: object) => ['classes', f ?? {}] as const,
  class: (id: string) => ['class', id] as const,
  terms: (f?: object) => ['terms', f ?? {}] as const,
  term: (id: string) => ['term', id] as const,
  sessions: (f?: object) => ['sessions', f ?? {}] as const,
  session: (id: string) => ['session', id] as const,
  makeups: ['makeups'] as const,
  payments: (f?: object) => ['payments', f ?? {}] as const,
  charges: (f?: object) => ['charges', f ?? {}] as const,
  financeSummary: (f?: object) => ['finance', 'summary', f ?? {}] as const,
  plans: (f?: object) => ['plans', f ?? {}] as const,
  plan: (id: string) => ['plan', id] as const,
  notifications: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  settings: ['coach', 'settings'] as const,
  myAccounts: ['me', 'accounts'] as const,
};

/** Invalidate everything affected by schedule / attendance / finance changes. */
export function invalidateOperational() {
  return Promise.all(
    ['dashboard', 'sessions', 'session', 'student', 'students', 'term', 'terms', 'makeups', 'payments', 'charges', 'finance'].map(
      (k) => queryClient.invalidateQueries({ queryKey: [k] }),
    ),
  );
}
