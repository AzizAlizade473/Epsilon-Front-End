import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProfileSetupScreen from '@/features/auth/screens/ProfileSetupScreen';
import { initializeI18n } from '@/lib/i18n';
import { authOperation } from '@/lib/auth-lifecycle';
import { mockUser } from '@/services/mock/fixtures';
import { ApiError } from '@/services/http/errors';
import type { ProfileInput } from '@/features/auth/profile-schema';
import type { ProfileUpdateResult } from '@/services/contracts';
import az from '../locales/az.json';

const mockReplace = jest.fn();
const mockUpdate = jest.fn(
  (_user: typeof mockUser, _nextStep: string | null) => '/home',
);
const mockSave =
  jest.fn<(input: ProfileInput) => Promise<ProfileUpdateResult>>();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('@/lib/env', () => ({ env: { EXPO_PUBLIC_MIN_AGE: 16 } }));
type SetupUser = Record<
  'firstName' | 'lastName' | 'birthDate' | 'email',
  string | null
>;
const complete: SetupUser = {
  firstName: 'Aygun',
  lastName: 'Aliyeva',
  birthDate: '2000-01-01',
  email: 'test@example.test',
};
let mockSetupUser: SetupUser = complete;
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: mockSetupUser }),
  useAuthActions: () => ({ updateUser: mockUpdate }),
}));
jest.mock('@/features/auth/hooks/useOnboardingConfig', () => ({
  useOnboardingConfig: () => ({ data: { minAge: 16 }, isError: false }),
}));
jest.mock('@/services', () => ({
  services: {
    user: { updateProfile: (input: ProfileInput) => mockSave(input) },
  },
}));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
beforeEach(async () => {
  jest.clearAllMocks();
  mockSetupUser = complete;
  authOperation.release();
  mockSave.mockReset().mockResolvedValue({ user: mockUser, nextStep: 'phone' });
  await initializeI18n();
});
async function form() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <ProfileSetupScreen />
    </SafeAreaProvider>,
  );
}
it('submits only the required fields and follows the server onboarding result', async () => {
  await form();
  await fireEvent.changeText(
    screen.getByLabelText(az.onboarding.firstName),
    '  Aygun  ',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith({
      firstName: 'Aygun',
      lastName: 'Aliyeva',
      birthDate: '2000-01-01',
      language: 'az',
    }),
  );
  expect(mockUpdate).toHaveBeenCalledWith(mockUser, 'phone');
  expect(mockReplace).toHaveBeenCalledWith('/home');
});
it('blocks invalid names without submitting personal data', async () => {
  await form();
  await fireEvent.changeText(
    screen.getByLabelText(az.onboarding.firstName),
    'A1',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
  expect(mockSave).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(
    az.onboarding.invalidName,
  );
});
it('locks inputs and prevents duplicate submissions while saving', async () => {
  let finish: (result: ProfileUpdateResult) => void = () => {};
  mockSave.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await form();
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText(az.onboarding.firstName)).toHaveProp(
    'editable',
    false,
  );
  await act(async () => {
    finish({ user: mockUser, nextStep: 'phone' });
  });
});
it('honors server AGE_RESTRICTED without navigating or publishing the user', async () => {
  mockSave.mockRejectedValue(
    new ApiError({
      code: 'AGE_RESTRICTED',
      status: 422,
      message: 'private detail',
    }),
  );
  await form();
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(/16/),
  );
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});
it('asks only for what Google did not fill, and always for a missing birth date', async () => {
  mockSetupUser = { ...complete, birthDate: null };
  await form();
  expect(screen.queryByLabelText(az.onboarding.firstName)).toBeNull();
  expect(screen.queryByLabelText(az.onboarding.lastName)).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
  await waitFor(() => expect(mockSave).toHaveBeenCalled());
  expect(Object.keys(mockSave.mock.calls[0]![0]).sort()).toEqual([
    'birthDate',
    'language',
  ]);
});
