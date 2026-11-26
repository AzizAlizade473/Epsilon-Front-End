import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PersonalInfoScreen from '@/features/profile/screens/PersonalInfoScreen';
import { initializeI18n, i18n } from '@/lib/i18n';
import { createQueryClient, queryKeys } from '@/services/query';
import { mockUser } from '@/services/mock/fixtures';
import { ApiError } from '@/services/http/errors';
import type { EmailList, User } from '@/services/contracts';
import az from '../locales/az.json';

const mockPush = jest.fn();
const mockUpdateUser = jest.fn();
const mockEmails = jest.fn<() => Promise<EmailList>>();
const mockRequest = jest.fn<(input: unknown) => Promise<unknown>>();
const mockVerify = jest.fn<(input: unknown) => Promise<EmailList>>();
const mockCancel = jest.fn(async () => undefined);
const mockRemoveEmail = jest.fn<(email: string) => Promise<void>>();
const mockRemovePhone = jest.fn<() => Promise<void>>();
const mockMe = jest.fn<() => Promise<User>>();
jest.mock('@/lib/env', () => ({ env: { ENABLE_GOOGLE_SIGNIN: false } }));
jest.mock('@/providers/AuthProvider', () => ({
  useAuthActions: () => ({ updateUser: mockUpdateUser }),
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ canGoBack: () => true, back: jest.fn(), push: mockPush }),
}));
jest.mock('@/services', () => ({
  services: {
    // A code request that never settles: the sheet stays busy.
    auth: { requestOtp: () => new Promise(() => undefined) },
    user: {
      me: () => mockMe(),
      emails: () => mockEmails(),
      requestEmail: (input: unknown) => mockRequest(input),
      verifyEmail: (input: unknown) => mockVerify(input),
      cancelPendingEmail: () => mockCancel(),
      removeEmail: (email: string) => mockRemoveEmail(email),
      removePhone: () => mockRemovePhone(),
    },
  },
}));
const primary = {
  email: mockUser.email!,
  primary: true,
  verifiedAt: '2026-01-01T00:00:00Z',
};
const second = { ...primary, email: 'second@example.test', primary: false };
const pending = {
  email: 'new@example.test',
  expiresAt: new Date(Date.now() + 120_000).toISOString(),
  makePrimary: true,
};
const client = createQueryClient();
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  client.setQueryData(queryKeys.user.profile(), {
    ...mockUser,
    identities: [],
  });
  mockEmails.mockReset().mockResolvedValue({ items: [], pending: null });
  mockRequest.mockReset().mockResolvedValue({ retryAfterSeconds: 60 });
  mockMe.mockReset().mockResolvedValue(mockUser);
  mockRemoveEmail.mockReset().mockResolvedValue(undefined);
  mockRemovePhone.mockReset().mockResolvedValue(undefined);
  await initializeI18n('az');
});
afterEach(() => client.clear());
const page = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>
        <PersonalInfoScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
const press = async (name: string) =>
  fireEvent.press(await screen.findByRole('button', { name }));

it('shows the account address and phone once, even with no e-mail identity', async () => {
  await page();
  expect(await screen.findByText(az.contact.changeEmail)).toBeTruthy();
  expect(screen.getAllByText(mockUser.email!)).toHaveLength(1);
  expect(screen.getAllByText(mockUser.phone!)).toHaveLength(1);
});
it('changes the e-mail: request, pending state, conflict-free verification', async () => {
  mockEmails
    .mockResolvedValueOnce({ items: [primary], pending: null })
    .mockResolvedValue({ items: [primary], pending });
  mockVerify.mockResolvedValue({
    items: [{ ...primary, email: pending.email }],
    pending: null,
  });
  await page();
  await press(az.contact.changeEmail);
  await fireEvent.changeText(
    screen.getByLabelText(az.contact.newEmail),
    ' New@Example.test ',
  );
  await press(az.auth.sendCode);
  expect(mockRequest).toHaveBeenCalledWith({
    email: pending.email,
    makePrimary: true,
  });
  await fireEvent.changeText(
    await screen.findByLabelText(az.auth.codeLabel),
    '123456',
  );
  await press(az.auth.verifyCode);
  await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(mockUser));
  expect(mockVerify).toHaveBeenCalledWith({
    email: pending.email,
    code: '123456',
  });
});
it('cancels a pending change', async () => {
  mockEmails
    .mockResolvedValueOnce({ items: [primary], pending })
    .mockResolvedValue({ items: [primary], pending: null });
  await page();
  await press(az.contact.cancelChange);
  await waitFor(() =>
    expect(screen.queryByLabelText(az.auth.codeLabel)).toBeNull(),
  );
  expect(mockCancel).toHaveBeenCalledTimes(1);
});
it('explains a conflict, and asks to sign in again when the server requires it', async () => {
  mockEmails.mockResolvedValue({ items: [primary, second], pending: null });
  mockRemoveEmail.mockRejectedValue(
    new ApiError({ code: 'REAUTH_REQUIRED', message: 'x', status: 403 }),
  );
  mockRequest.mockRejectedValue(
    new ApiError({ code: 'EMAIL_IN_USE', message: 'x', status: 409 }),
  );
  await page();
  await press(az.contact.addSecondary);
  await fireEvent.changeText(
    screen.getByLabelText(az.contact.newEmail),
    'taken@example.test',
  );
  await press(az.auth.sendCode);
  expect(await screen.findByText(az.contact.errors.EMAIL_IN_USE)).toBeTruthy();
  await press(i18n.t('contact.removeEmail', { email: second.email }) as string);
  await press(az.contact.confirmRemove);
  expect(await screen.findByText(az.contact.reauthTitle)).toBeTruthy();
});
it('removes the phone and offers to add one afterwards', async () => {
  mockMe.mockResolvedValue({ ...mockUser, phone: null, phoneVerified: false });
  await page();
  await press(az.contact.changePhone);
  await press(az.contact.confirmRemove);
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/phone-verify'));
  expect(mockRemovePhone).toHaveBeenCalledTimes(1);
});
it('asks to sign in again before removing the phone', async () => {
  mockRemovePhone.mockRejectedValue(
    new ApiError({ code: 'REAUTH_REQUIRED', message: 'x', status: 403 }),
  );
  await page();
  await press(az.contact.removePhone);
  await press(az.contact.confirmRemove);
  expect(await screen.findByText(az.contact.reauthTitle)).toBeTruthy();
  expect(mockUpdateUser).not.toHaveBeenCalled();
  // Cancel is locked mid-request, so a late success cannot repeat a cancelled change.
  await press(
    i18n.t('profile.reauthEmail', { email: mockUser.email }) as string,
  );
  const cancel = screen.getAllByRole('button', { name: az.common.cancel });
  expect(cancel.at(-1)).toBeDisabled();
});
it('keeps the phone when it is the last sign-in method', async () => {
  mockRemovePhone.mockRejectedValue(
    new ApiError({ code: 'LAST_SIGN_IN_METHOD', message: 'x', status: 409 }),
  );
  await page();
  await press(az.contact.removePhone);
  await press(az.contact.confirmRemove);
  expect(
    await screen.findByText(az.contact.errors.LAST_SIGN_IN_METHOD),
  ).toBeTruthy();
  expect(mockUpdateUser).not.toHaveBeenCalled();
});
