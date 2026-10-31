/**
 * 03.g — React Query configuration and key factories tests.
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  createQueryClient,
  queryKeys,
  queryInvalidations,
  QUERY_DEFAULT_STALE_TIME,
  QUERY_DEFAULT_GC_TIME,
} from '@/services/query';

describe('React Query setup', () => {
  it('configures QueryClient with required default staleTime and gcTime', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(QUERY_DEFAULT_STALE_TIME);
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.gcTime).toBe(QUERY_DEFAULT_GC_TIME);
    expect(defaults.queries?.gcTime).toBe(300_000);
    expect(defaults.queries?.retry).toBe(false);
    expect(defaults.mutations?.retry).toBe(false);
  });

  it('produces hierarchical and distinct query keys for each feature', () => {
    expect(queryKeys.auth.all).toEqual(['auth']);
    expect(queryKeys.user.profile()).toEqual(['user', 'profile']);
    expect(queryKeys.config.current()).toEqual(['config', 'current']);
    expect(queryKeys.restaurant.list()).toEqual(['restaurant', 'list']);
    expect(queryKeys.restaurant.detail('rest_1')).toEqual([
      'restaurant',
      'detail',
      'rest_1',
    ]);
    expect(queryKeys.receipt.detail('rcpt_1')).toEqual([
      'receipt',
      'detail',
      'rcpt_1',
    ]);
    expect(queryKeys.feedback.list({ limit: 10 })).toEqual([
      'feedback',
      'list',
      { limit: 10 },
    ]);
    expect(queryKeys.wallet.summary()).toEqual(['wallet', 'summary']);
    expect(queryKeys.wallet.transactions({ cursor: 'cur_1' })).toEqual([
      'wallet',
      'transactions',
      { cursor: 'cur_1' },
    ]);
    expect(queryKeys.wallet.transaction('tx_1')).toEqual([
      'wallet',
      'transaction',
      'tx_1',
    ]);
    expect(queryKeys.notification.settings()).toEqual([
      'notification',
      'settings',
    ]);
  });

  it('invalidation helpers trigger query invalidation or cache clearing', async () => {
    const client = createQueryClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const clearSpy = jest.spyOn(client, 'clear');

    await queryInvalidations.onProfileUpdated(client);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user'] });

    await queryInvalidations.onFeedbackSubmitted(client);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['wallet'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['feedback'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['receipt'] });

    await queryInvalidations.onLogout(client);
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});
