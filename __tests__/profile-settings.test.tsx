import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import PrivacyScreen from '@/features/profile/screens/PrivacyScreen';
import { maskedPhone } from '@/lib/profile';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import PersonalInfoScreen from '@/features/profile/screens/PersonalInfoScreen';
import LanguageScreen from '@/features/profile/screens/LanguageScreen';
import { NotificationsScreen } from '@/features/profile/screens/NotificationsScreen';
import { createQueryClient, queryKeys } from '@/services/query';
import { initializeI18n, i18n } from '@/lib/i18n';
import { mockUser } from '@/services/mock/fixtures';
import type {
  NotificationPreferences,
  ProfileUpdateResult,
} from '@/services/contracts';
import az from '../locales/az.json';
const mockUpdate =
  jest.fn<
    (input: {
      firstName?: string;
      lastName?: string;
      language?: string;
    }) => Promise<ProfileUpdateResult>
  >();
const mockUpdateUser = jest.fn();
const mockToast = jest.fn();
jest.mock('@/lib/env', () => ({ env: { ENABLE_GOOGLE_SIGNIN: false } }));
const mockRequestOtp = jest
  .fn<() => Promise<void>>()
  .mockResolvedValue(undefined);
const mockPreferences =
  jest.fn<
    (input: NotificationPreferences) => Promise<NotificationPreferences>
  >();
jest.mock('@/providers/AuthProvider', () => ({
  useAuthActions: () => ({ updateUser: mockUpdateUser }),
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, back: jest.fn() }),
}));
jest.mock('@/services', () => ({
  services: {
    auth: { requestOtp: () => mockRequestOtp() },
    user: {
      me: async () => mockUser,
      updateProfile: (input: { firstName?: string; language?: string }) =>
        mockUpdate(input),
    },
    notification: {
      settings: async () => ({ cashbackUpdates: true, partnerUpdates: false }),
      updatePreferences: (input: NotificationPreferences) =>
        mockPreferences(input),
    },
  },
}));
const client = createQueryClient();
const readPermission = async () => true;
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  client.setQueryData(queryKeys.user.profile(), mockUser);
  mockUpdate.mockReset().mockResolvedValue({ user: mockUser, nextStep: null });
  mockPreferences.mockReset().mockImplementation(async (input) => input);
  mockRequestOtp.mockReset().mockResolvedValue(undefined);
  await initializeI18n();
  await i18n.changeLanguage('az');
});
it('native deletion-modal Back closes idle flow but preserves an active reauthentication request', async () => {
  let finish: (() => void) | undefined;
  mockRequestOtp.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await page(<PrivacyScreen />);
  await fireEvent.press(
    screen.getByRole('button', { name: az.profile.deleteAccount }),
  );
  expect(screen.getByTestId('account-deletion-modal').props.visible).toBe(true);
  await fireEvent(screen.getByTestId('account-deletion-modal'), 'requestClose');
  expect(screen.queryByTestId('account-deletion-modal')).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: az.profile.deleteAccount }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
  await fireEvent.press(
    screen.getByRole('button', {
      name: i18n.t('profile.reauthPhone', {
        phone: maskedPhone(mockUser.phone!),
      }),
    }),
  );
  expect(mockRequestOtp).toHaveBeenCalledTimes(1);
  await fireEvent(screen.getByTestId('account-deletion-modal'), 'requestClose');
  expect(screen.getByTestId('account-deletion-modal').props.visible).toBe(true);
  finish?.();
  await waitFor(() =>
    expect(screen.getByLabelText(az.profile.smsCode)).toBeOnTheScreen(),
  );
  await fireEvent(screen.getByTestId('account-deletion-modal'), 'requestClose');
  expect(screen.queryByTestId('account-deletion-modal')).toBeNull();
});
afterEach(() => client.clear());
async function page(child: React.ReactNode) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>{child}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}
it('keeps edited names on a failed save and rejects invalid input before mutation', async () => {
  mockUpdate.mockRejectedValue(new Error('Offline'));
  await page(<PersonalInfoScreen />);
  await fireEvent.changeText(
    screen.getByLabelText(az.onboarding.firstName),
    '',
  );
  await fireEvent.press(screen.getByRole('button', { name: az.profile.save }));
  expect(mockUpdate).not.toHaveBeenCalled();
  await fireEvent.changeText(
    screen.getByLabelText(az.onboarding.firstName),
    'Updated',
  );
  await fireEvent.press(screen.getByRole('button', { name: az.profile.save }));
  await waitFor(() =>
    expect(screen.getByText(az.errors.generic)).toBeOnTheScreen(),
  );
  expect(screen.getByDisplayValue('Updated')).toBeOnTheScreen();
  expect(mockUpdateUser).not.toHaveBeenCalled();
  expect(mockToast).not.toHaveBeenCalledWith(az.profile.saved);
});
it('applies language immediately, persists it and offers retry when server sync fails', async () => {
  mockUpdate.mockRejectedValue(new Error('Offline'));
  await page(<LanguageScreen />);
  await fireEvent.press(screen.getByRole('radio', { name: 'English' }));
  await waitFor(() => expect(i18n.language).toBe('en'));
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
    'epsilon.language',
    'en',
  );
  expect(mockUpdate).toHaveBeenCalledWith({ language: 'en' });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen(),
  );
  expect(mockUpdateUser).not.toHaveBeenCalled();
});
it('requests notification permission only after the explanation is accepted and never persists a denied opt-in', async () => {
  const enable = jest.fn(async () => false);
  await page(
    <NotificationsScreen
      enableDevice={enable}
      readPermission={readPermission}
    />,
  );
  await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(2));
  expect(enable).not.toHaveBeenCalled();
  await fireEvent(
    screen.getByRole('switch', { name: az.profile.partnerUpdates }),
    'valueChange',
    true,
  );
  expect(enable).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('button', { name: az.profile.notificationAllow }),
  );
  expect(enable).toHaveBeenCalledTimes(1);
  expect(mockPreferences).not.toHaveBeenCalled();
});
it('saves a disabled notification preference without requesting OS permission', async () => {
  const enable = jest.fn(async () => true);
  await page(
    <NotificationsScreen
      enableDevice={enable}
      readPermission={readPermission}
    />,
  );
  await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(2));
  await fireEvent(
    screen.getByRole('switch', { name: az.profile.cashbackUpdates }),
    'valueChange',
    false,
  );
  await waitFor(() =>
    expect(mockPreferences).toHaveBeenCalledWith({
      cashbackUpdates: false,
      partnerUpdates: false,
    }),
  );
  expect(enable).not.toHaveBeenCalled();
});
