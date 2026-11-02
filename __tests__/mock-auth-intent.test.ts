import { expect, test } from '@jest/globals';
import { mockAuthService, mockUserService } from '@/services/mock/services';
import { setMockScenario } from '@/services/mock/scenario';

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
});
