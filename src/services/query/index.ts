/**
 * 03.g — React Query default configuration, key factories, and invalidation helpers.
 *
 * Requirements (from 03-services spec):
 * - staleTime: 30 s (30_000 ms)
 * - gcTime: 5 min (5 * 60 * 1000 ms)
 * - retry: false (controlled at HTTP client layer with exponential backoff & jitter)
 * - Key factories per feature: auth, user, config, restaurant, receipt, feedback, wallet, notification
 * - Precise invalidation helpers
 */

import { QueryClient } from '@tanstack/react-query';
import { trackQueryFreshness } from './freshness';

export const QUERY_DEFAULT_STALE_TIME = 30_000; // 30 seconds
export const QUERY_DEFAULT_GC_TIME = 5 * 60 * 1000; // 5 minutes

export function createQueryClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_DEFAULT_STALE_TIME,
        gcTime: QUERY_DEFAULT_GC_TIME,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  trackQueryFreshness(client);
  return client;
}

/**
 * Feature key factories for hierarchical and precise query caching.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },
  config: {
    all: ['config'] as const,
    current: () => [...queryKeys.config.all, 'current'] as const,
  },
  restaurant: {
    all: ['restaurant'] as const,
    list: (params?: { search?: string; limit?: number }) =>
      params
        ? ([...queryKeys.restaurant.all, 'list', params] as const)
        : ([...queryKeys.restaurant.all, 'list'] as const),
    detail: (id: string) =>
      [...queryKeys.restaurant.all, 'detail', id] as const,
  },
  receipt: {
    all: ['receipt'] as const,
    detail: (id: string) => [...queryKeys.receipt.all, 'detail', id] as const,
  },
  feedback: {
    all: ['feedback'] as const,
    list: (params?: { cursor?: string; limit?: number }) =>
      [...queryKeys.feedback.all, 'list', params] as const,
  },
  wallet: {
    all: ['wallet'] as const,
    summary: () => [...queryKeys.wallet.all, 'summary'] as const,
    transactions: (params?: { cursor?: string; limit?: number }) =>
      [...queryKeys.wallet.all, 'transactions', params] as const,
    transaction: (id: string) =>
      [...queryKeys.wallet.all, 'transaction', id] as const,
  },
  notification: {
    all: ['notification'] as const,
    settings: () => [...queryKeys.notification.all, 'settings'] as const,
  },
} as const;

/**
 * Helpers for precise query cache invalidation after mutations.
 */
export const queryInvalidations = {
  async onProfileUpdated(client: QueryClient): Promise<void> {
    await client.invalidateQueries({ queryKey: queryKeys.user.all });
  },

  async onFeedbackSubmitted(client: QueryClient): Promise<void> {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.wallet.all }),
      client.invalidateQueries({ queryKey: queryKeys.feedback.all }),
      client.invalidateQueries({ queryKey: queryKeys.receipt.all }),
    ]);
  },

  async onLogout(client: QueryClient): Promise<void> {
    client.clear();
  },
};
