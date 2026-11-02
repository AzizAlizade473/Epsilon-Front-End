import { afterEach, expect, jest, test } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { useOnboardingConfig } from '@/features/auth/hooks/useOnboardingConfig';
import { createQueryClient, queryKeys } from '@/services/query';
import { mockUser } from '@/services/mock/fixtures';

const config = {
  minAppVersion: '0.1.0',
  minAge: 18,
  requirePhoneVerification: false,
};
const mockGet = jest.fn(async () => config);
jest.mock('@/lib/env', () => ({ env: { ENABLE_GOOGLE_SIGNIN: false } }));
jest.mock('@/services', () => ({
  services: {
    config: { get: () => mockGet() },
    user: { me: async () => mockUser },
    auth: { logout: async () => {} },
  },
}));
const client = createQueryClient();
// Avoid test-only GC handles after auth clears an observed query; production TTL is unchanged.
// https://tanstack.com/query/latest/docs/framework/react/guides/testing
client.setDefaultOptions({
  ...client.getDefaultOptions(),
  queries: { ...client.getDefaultOptions().queries, gcTime: Infinity },
});
const session = {
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
  expiresAt: '2030-01-01T00:00:00Z',
};
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider boot={{ session, onboardingComplete: true }}>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
afterEach(() => {
  client.clear();
  jest.clearAllMocks();
});
test('profile config fetch completes without waiting on its own query and applies server rules', async () => {
  const hook = await renderHook(
    () => ({
      query: useOnboardingConfig(),
      auth: useAuth(),
    }),
    { wrapper: Wrapper },
  );
  await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true));
  expect(mockGet).toHaveBeenCalledTimes(1);
  expect(hook.result.current.auth).toMatchObject({
    minimumAge: 18,
    requirePhoneVerification: false,
  });
});
test('fresh cached config also updates auth requirements without an extra request', async () => {
  client.setQueryDefaults(queryKeys.config.current(), { staleTime: Infinity });
  client.setQueryData(queryKeys.config.current(), config);
  const hook = await renderHook(
    () => ({ query: useOnboardingConfig(), auth: useAuth() }),
    { wrapper: Wrapper },
  );
  await waitFor(() => expect(hook.result.current.auth.minimumAge).toBe(18));
  expect(hook.result.current.auth.requirePhoneVerification).toBe(false);
  expect(mockGet).not.toHaveBeenCalled();
});
