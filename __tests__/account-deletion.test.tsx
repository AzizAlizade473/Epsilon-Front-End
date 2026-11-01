import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DeleteAccountFlow } from '@/features/profile/components/DeleteAccountFlow';
import { initializeI18n } from '@/lib/i18n';
import { mockUser } from '@/services/mock/fixtures';
import type { AuthResult } from '@/services/contracts';
import az from '../locales/az.json';
const mockReauth = jest.fn(async (_result: AuthResult) => undefined);
const mockFinish = jest.fn(async () => undefined);
const mockRemove = jest.fn(async () => undefined);
const mockReplace = jest.fn();
const mockDismiss = jest.fn();
const mockRevoke = jest.fn(async () => undefined);
const mockSignOut = jest.fn(async () => undefined);
const result: AuthResult = {
  user: mockUser,
  session: {
    accessToken: 'test-fresh-access',
    refreshToken: 'test-fresh-refresh',
    expiresAt: '2030-01-01T00:00:00Z',
  },
  isNewUser: false,
  nextStep: 'home',
};
const mockVerify = jest.fn<() => Promise<AuthResult>>();
jest.mock('@/lib/env', () => ({ env: { ENABLE_GOOGLE_SIGNIN: false } }));
jest.mock('@/lib/google-signin', () => ({
  googleDriver: {
    revokeAccess: () => mockRevoke(),
    signOut: () => mockSignOut(),
  },
}));
jest.mock('@/providers/AuthProvider', () => ({
  useAuthActions: () => ({
    reauthenticate: (auth: AuthResult) => mockReauth(auth),
    finishAccountDeletion: () => mockFinish(),
  }),
}));
jest.mock('@/services', () => ({
  services: {
    auth: {
      requestOtp: async () => ({
        retryAfterSeconds: 60,
        expiresAt: '2030-01-01T00:00:00Z',
      }),
      verifyOtp: () => mockVerify(),
    },
    user: { deleteAccount: () => mockRemove() },
  },
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, dismissAll: mockDismiss }),
}));
beforeEach(async () => {
  jest.clearAllMocks();
  mockVerify.mockReset().mockResolvedValue(result);
  mockRemove.mockReset().mockResolvedValue(undefined);
  await initializeI18n();
});
async function start() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <DeleteAccountFlow
        user={{ ...mockUser, deletionWarning: 'Backend warning' }}
        onClose={jest.fn()}
      />
    </SafeAreaProvider>,
  );
  expect(screen.getByText('Backend warning')).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
  const request = screen
    .getAllByRole('button')
    .find((node) =>
      String(node.props.accessibilityLabel).includes('kod göndər'),
    )!;
  await fireEvent.press(request);
  await waitFor(() =>
    expect(screen.getByLabelText(az.profile.smsCode)).toBeOnTheScreen(),
  );
  await fireEvent.changeText(
    screen.getByLabelText(az.profile.smsCode),
    '123456',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
}
it('refuses a fresh authentication result for another account', async () => {
  mockVerify.mockResolvedValue({
    ...result,
    user: { ...mockUser, id: 'other-account' },
  });
  await start();
  await waitFor(() =>
    expect(screen.getByText(az.profile.deleteError)).toBeOnTheScreen(),
  );
  expect(mockReauth).not.toHaveBeenCalled();
  expect(mockRemove).not.toHaveBeenCalled();
});
it('requires fresh same-account authentication and the exact typed confirmation before deleting', async () => {
  await start();
  await waitFor(() =>
    expect(
      screen.getByLabelText(az.profile.deleteConfirmation),
    ).toBeOnTheScreen(),
  );
  expect(mockReauth).toHaveBeenCalledWith(result);
  expect(
    screen.getByRole('button', { name: az.profile.deleteAccount }),
  ).toBeDisabled();
  await fireEvent.changeText(
    screen.getByLabelText(az.profile.deleteConfirmation),
    'SİL',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.profile.deleteAccount }),
  );
  await waitFor(() => expect(mockFinish).toHaveBeenCalledTimes(1));
  expect(mockRemove).toHaveBeenCalledTimes(1);
  expect(mockRevoke).toHaveBeenCalledTimes(1);
  expect(mockSignOut).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/welcome');
});
it('does not clear local data or navigate away after a rejected backend deletion', async () => {
  mockRemove.mockRejectedValue(new Error('Rejected'));
  await start();
  await waitFor(() =>
    expect(
      screen.getByLabelText(az.profile.deleteConfirmation),
    ).toBeOnTheScreen(),
  );
  await fireEvent.changeText(
    screen.getByLabelText(az.profile.deleteConfirmation),
    'SİL',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.profile.deleteAccount }),
  );
  await waitFor(() =>
    expect(screen.getByText(az.profile.deleteError)).toBeOnTheScreen(),
  );
  expect(mockFinish).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});
