import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthProvider,
  useAuth,
  useAuthActions,
} from '@/providers/AuthProvider';
import { FeedbackProvider, useFeedback } from '@/providers/FeedbackProvider';
import { createQueryClient } from '@/services/query';
import { getAccessToken } from '@/services/http/client';
import { mockUser } from '@/services/mock/fixtures';
import type { AuthResult } from '@/services/contracts';
import { initializeI18n } from '@/lib/i18n';
const mockToast = jest.fn();
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_API_URL: 'https://api.test', ENABLE_GOOGLE_SIGNIN: false },
}));
jest.mock('@/services', () => ({
  services: {
    auth: { logout: async () => undefined },
    feedback: {
      submit: async () => {
        throw new Error('Offline');
      },
    },
  },
}));
const client = createQueryClient();
const result: AuthResult = {
  user: mockUser,
  session: {
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
    expiresAt: '2030-01-01T00:00:00Z',
  },
  isNewUser: false,
  nextStep: 'home',
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>
    <AuthProvider boot={{ session: null, onboardingComplete: true }}>
      <FeedbackProvider>{children}</FeedbackProvider>
    </AuthProvider>
  </QueryClientProvider>
);
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  await AsyncStorage.clear();
  await initializeI18n();
});
afterEach(() => client.clear());
it('rejects a different account during reauthentication without replacing the active session', async () => {
  const hook = await renderHook(
    () => ({ actions: useAuthActions(), auth: useAuth() }),
    { wrapper },
  );
  await act(async () => {
    await hook.result.current.actions.completeSignIn(result);
  });
  await act(async () => {
    await expect(
      hook.result.current.actions.reauthenticate({
        ...result,
        user: { ...mockUser, id: 'different' },
        session: { ...result.session, accessToken: 'other-token' },
      }),
    ).rejects.toThrow('Account mismatch');
  });
  expect(getAccessToken()).toBe('test-access');
  expect(hook.result.current.auth.user?.id).toBe(mockUser.id);
});
it.each(['logout', 'deletion'] as const)(
  'clears user queries, tokens, outbox, preferences and completion on %s',
  async (action) => {
    const hook = await renderHook(
      () => ({
        actions: useAuthActions(),
        auth: useAuth(),
        feedback: useFeedback(),
      }),
      { wrapper },
    );
    await act(async () => {
      await hook.result.current.actions.completeSignIn(result);
    });
    await AsyncStorage.setItem('epsilon.feedback.outbox.old', '[]');
    await AsyncStorage.setItem('epsilon.preferences.old', 'true');
    client.setQueryData(['private-user-data'], { private: true });
    await act(async () => {
      if (action === 'deletion')
        await hook.result.current.actions.finishAccountDeletion();
      else await hook.result.current.actions.logout();
    });
    expect(getAccessToken()).toBeNull();
    expect(hook.result.current.auth.session).toBeNull();
    expect(hook.result.current.auth.user).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
    expect(hook.result.current.feedback.entries).toEqual([]);
    expect(hook.result.current.feedback.completion).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('epsilon.session');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'epsilon.language',
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'epsilon.onboarding.completed',
    );
    expect(hook.result.current.auth.onboardingComplete).toBe(false);
  },
);
