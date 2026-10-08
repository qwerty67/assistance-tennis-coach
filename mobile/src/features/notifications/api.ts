import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { qk, queryClient } from '@/shared/services/queryClient';
import type { AppNotification } from '@/shared/types/api';

export const notificationsApi = {
  list: () => api.get<AppNotification[]>('/notifications'),
  unread: () => api.get<{ count: number }>('/notifications/unread-count'),
  read: (id: string) => api.post(`/notifications/${id}/read`),
  readAll: () => api.post('/notifications/read-all'),
  registerDevice: (token: string, platform: string) => api.post('/notifications/devices', { token, platform }),
};

export const useNotifications = () => useQuery({ queryKey: qk.notifications, queryFn: notificationsApi.list });
export const useUnreadCount = () => useQuery({ queryKey: qk.unread, queryFn: notificationsApi.unread, refetchInterval: 60_000 });
const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
export const useReadNotification = () => useMutation({ mutationFn: notificationsApi.read, onSuccess: refresh });
export const useReadAll = () => useMutation({ mutationFn: notificationsApi.readAll, onSuccess: refresh });
