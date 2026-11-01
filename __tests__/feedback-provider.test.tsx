import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { AppState } from 'react-native';
import type { ReactNode } from 'react';
import { FeedbackProvider, useFeedback } from '@/providers/FeedbackProvider';
import { createQueryClient } from '@/services/query';
import {
  feedbackOutboxPrefix,
  type OutboxEntry,
} from '@/services/feedback-outbox';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
import { i18n, initializeI18n } from '@/lib/i18n';
import { ApiError } from '@/services/http/errors';
import type { FeedbackInput, FeedbackResult } from '@/services/contracts';
import type { MutationOptions } from '@/services/interfaces';

let mockOwner = 'account';
const mockToast = jest.fn();
const mockSubmit =
  jest.fn<
    (input: FeedbackInput, options?: MutationOptions) => Promise<FeedbackResult>
  >();
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: mockOwner } }),
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('@/services', () => ({
  services: {
    feedback: {
      submit: (input: FeedbackInput, options?: MutationOptions) =>
        mockSubmit(input, options),
    },
  },
}));
const client = createQueryClient();
const payload: OutboxEntry = {
  receiptId: 'receipt',
  receiptItemId: 'item',
  rating: 2,
  comment: 'Saved',
  reasonCodes: ['taste'],
  idempotencyKey: 'stable-key',
  createdAt: Date.now(),
};
const result: FeedbackResult = {
  feedbackId: 'feedback',
  reward: { status: 'pending', amountMinor: null },
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>
    <FeedbackProvider>{children}</FeedbackProvider>
  </QueryClientProvider>
);
beforeEach(async () => {
  mockOwner = 'account';
  client.clear();
  mockSubmit.mockReset().mockResolvedValue(result);
  mockToast.mockReset();
  await AsyncStorage.clear();
  await initializeI18n();
});
afterEach(() => {
  onlineManager.setOnline(true);
  client.clear();
  jest.restoreAllMocks();
});
it('queues without contacting the backend while offline and sends once on reconnect', async () => {
  onlineManager.setOnline(false);
  const hook = await renderHook(useFeedback, { wrapper });
  await act(async () => {
    expect(await hook.result.current.submit(payload, 'Dish')).toBe('queued');
  });
  expect(mockSubmit).not.toHaveBeenCalled();
  expect(hook.result.current.entries).toEqual([payload]);
  await act(async () => {
    onlineManager.setOnline(true);
  });
  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(hook.result.current.entries).toEqual([]));
});
it('replays after login/start and invalidates server data without presenting a background reward', async () => {
  await AsyncStorage.setItem(
    feedbackOutboxPrefix + mockOwner,
    JSON.stringify([payload]),
  );
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const hook = await renderHook(useFeedback, { wrapper });
  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(hook.result.current.completedIds).toEqual(['item']),
  );
  expect(mockSubmit).toHaveBeenCalledWith(
    {
      receiptItemId: 'item',
      rating: 2,
      comment: 'Saved',
      reasonCodes: ['taste'],
    },
    { signal: expect.any(AbortSignal), idempotencyKey: 'stable-key' },
  );
  expect(hook.result.current.completion).toBeNull();
  expect(invalidate).toHaveBeenCalledTimes(3);
});
it('keeps a failed draft and retries the original key on foreground', async () => {
  let foreground: ((state: 'active') => void) | undefined;
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      foreground = listener;
      return { remove: jest.fn() };
    });
  mockSubmit.mockRejectedValue(
    new ApiError({ code: 'NETWORK', message: 'Offline', status: 0 }),
  );
  const hook = await renderHook(useFeedback, { wrapper });
  await act(async () => {
    expect(await hook.result.current.submit(payload, 'Dish')).toBe('queued');
  });
  expect(hook.result.current.entries).toEqual([payload]);
  mockSubmit.mockResolvedValue(result);
  await act(async () => {
    foreground?.('active');
  });
  await waitFor(() => expect(hook.result.current.entries).toEqual([]));
  expect(
    mockSubmit.mock.calls.map(([, options]) => options?.idempotencyKey),
  ).toEqual(['stable-key', 'stable-key']);
  expect(hook.result.current.completion).toBeNull();
});
it('retains server result only in memory for a manual submit and clears every feedback key on logout', async () => {
  const hook = await renderHook(useFeedback, { wrapper });
  await act(async () => {
    expect(await hook.result.current.submit(payload, 'Dish')).toBe('sent');
  });
  expect(hook.result.current.completion?.result).toEqual(result);
  await AsyncStorage.setItem(
    feedbackOutboxPrefix + 'old-account',
    JSON.stringify([payload]),
  );
  await AsyncStorage.setItem('language', 'az');
  await act(async () => {
    await clearAuthFlows();
  });
  expect(hook.result.current.completion).toBeNull();
  expect(hook.result.current.completedIds).toEqual([]);
  expect(await AsyncStorage.getAllKeys()).toEqual(['language']);
});
it('never carries confirmation or pending work into another account', async () => {
  const hook = await renderHook(useFeedback, { wrapper });
  await act(async () => {
    await hook.result.current.submit(payload, 'Private dish');
  });
  mockOwner = 'other-account';
  await hook.rerender(undefined);
  expect(hook.result.current.completion).toBeNull();
  expect(hook.result.current.completedIds).toEqual([]);
});
it('does not abort an in-flight durable send when the language changes', async () => {
  let finish: ((result: FeedbackResult) => void) | undefined;
  mockSubmit.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const hook = await renderHook(useFeedback, { wrapper });
  let pending: Promise<string> | undefined;
  await act(async () => {
    pending = hook.result.current.submit(payload, 'Dish');
  });
  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
  const signal = mockSubmit.mock.calls[0]?.[1]?.signal;
  await act(async () => {
    await i18n.changeLanguage('en');
  });
  expect(signal?.aborted).toBe(false);
  await act(async () => {
    finish?.(result);
    await pending;
  });
  expect(mockSubmit).toHaveBeenCalledTimes(1);
  expect(hook.result.current.entries).toEqual([]);
  await act(async () => {
    await i18n.changeLanguage('az');
  });
});
