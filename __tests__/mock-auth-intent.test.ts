import { expect, test } from '@jest/globals';
import { mockAuthService, mockUserService } from '@/services/mock/services';
import { setMockScenario } from '@/services/mock/scenario';
import { mockUser } from '@/services/mock/fixtures';
import { emailListSchema } from '@/services/contracts';

test('fixture registration verifies first, asks for profile, then returns the same existing account', async () => {
  setMockScenario('success');
  const phone = '+994509876543';
  await expect(
    mockAuthService.verifyOtp({ phone, code: '123456', intent: 'login' }),
  ).rejects.toMatchObject({ reason: 'notFound' });
  const created = await mockAuthService.verifyOtp({
    phone,
    code: '123456',
    intent: 'register',
  });
  expect(created).toMatchObject({
    isNewUser: true,
    nextStep: 'profile',
    user: {
      firstName: null,
      lastName: null,
      birthDate: null,
      phoneVerified: true,
    },
  });
  await mockUserService.updateProfile({
    firstName: 'Test',
    lastName: 'Member',
    birthDate: '1990-01-01',
  });
  await expect(
    mockAuthService.verifyOtp({ phone, code: '123456', intent: 'register' }),
  ).rejects.toMatchObject({ reason: 'exists' });
  const existing = await mockAuthService.verifyOtp({
    phone,
    code: '123456',
    intent: 'login',
  });
  expect(existing.user.id).toBe(created.user.id);
  expect(existing.nextStep).toBe('home');
  await expect(
    mockAuthService.verifyOtp({ phone, code: '000000', intent: 'login' }),
  ).rejects.toMatchObject({ code: 'OTP_INVALID' });
  await mockUserService.deleteAccount();
  await expect(
    mockAuthService.verifyOtp({ phone, code: '123456', intent: 'login' }),
  ).rejects.toMatchObject({ reason: 'notFound' });
  const replacement = await mockAuthService.verifyOtp({
    phone,
    code: '123456',
    intent: 'register',
  });
  expect(replacement.user.id).not.toBe(created.user.id);
});
test('Google fixture intent does not silently provision during Login', async () => {
  await expect(
    mockAuthService.signInWithGoogle({
      idToken: 'fixture-new-google',
      intent: 'login',
    }),
  ).rejects.toMatchObject({ reason: 'notFound' });
  await expect(
    mockAuthService.signInWithGoogle({
      idToken: 'fixture-new-google',
      intent: 'register',
    }),
  ).resolves.toMatchObject({ nextStep: 'profile', isNewUser: true });
  await expect(
    mockAuthService.signInWithGoogle({
      idToken: 'fixture-new-google',
      intent: 'register',
    }),
  ).rejects.toMatchObject({ reason: 'exists' });
  await expect(
    mockAuthService.verifyPhoneLink({ phone: '+994501234567', code: '123456' }),
  ).rejects.toMatchObject({ code: 'PHONE_IN_USE' });
  await expect(mockUserService.me()).resolves.toMatchObject({ phone: null });
  await expect(
    mockAuthService.verifyPhoneLink({ phone: '+994509876545', code: '123456' }),
  ).resolves.toMatchObject({ phone: '+994509876545', phoneVerified: true });
});
test('fixture e-mail change: pending, verify, conflicts, removal', async () => {
  const email = 'second@example.test';
  await mockAuthService.verifyOtp({
    email: 'first@example.test',
    code: '123456',
    intent: 'register',
  });
  await mockUserService.requestEmail({ email, makePrimary: true });
  await expect(mockUserService.emails()).resolves.toMatchObject({
    items: [{ email: 'first@example.test', primary: true }],
    pending: { email, makePrimary: true },
  });
  const changed = emailListSchema.parse(
    await mockUserService.verifyEmail({ email, code: '123456' }),
  );
  expect(changed.items.map((item) => [item.email, item.primary])).toEqual(
    expect.arrayContaining([
      [email, true],
      ['first@example.test', false],
    ]),
  );
  await expect(mockUserService.removeEmail(email)).rejects.toMatchObject({
    code: 'EMAIL_IS_PRIMARY',
  });
  await mockUserService.removeEmail('first@example.test');
  await expect(
    mockUserService.requestEmail({
      email: mockUser.email!,
      makePrimary: false,
    }),
  ).rejects.toMatchObject({ code: 'EMAIL_IN_USE' });
});
