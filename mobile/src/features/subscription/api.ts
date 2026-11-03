import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/services/apiClient';
import { invalidateOperational, queryClient } from '@/shared/services/queryClient';
import type {
  CoachSubscriptionStatus,
  SubscribeResult,
  SubscriptionPlan,
  SubscriptionTier,
} from '@/shared/types/api';

export const subscriptionApi = {
  plans: () => api.get<SubscriptionPlan[]>('/subscriptions/plans'),
  current: () => api.get<CoachSubscriptionStatus>('/subscriptions/current'),
  subscribe: (body: { plan_tier: SubscriptionTier; payment_method?: string }) =>
    api.post<SubscribeResult>('/subscriptions/subscribe', body),
};

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: () => subscriptionApi.plans(),
  });

export const useCurrentSubscription = (enabled: boolean = true) =>
  useQuery({
    queryKey: ['subscriptions', 'current'],
    queryFn: () => subscriptionApi.current(),
    enabled,
  });

const refresh = () => {
  queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
  queryClient.invalidateQueries({ queryKey: ['auth'] });
  return invalidateOperational();
};

export const useSubscribe = () =>
  useMutation({
    mutationFn: (body: { plan_tier: SubscriptionTier; payment_method?: string }) =>
      subscriptionApi.subscribe(body),
    onSuccess: refresh,
  });
