import { afterEach, expect, it } from '@jest/globals';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
import { otpChallenge } from '@/features/auth/store';
afterEach(() => otpChallenge.clear());
it('logout clears a linked-phone challenge and a late lock cannot recreate its phone state', async () => {
  otpChallenge.set('+994501234567', 60, 'link');
  otpChallenge.lock(120);
  expect(otpChallenge.get()).toMatchObject({ mode: 'link' });
  expect(otpChallenge.get()!.resendAt).toBeGreaterThanOrEqual(
    otpChallenge.get()!.lockedUntil,
  );
  await clearAuthFlows();
  otpChallenge.lock(120);
  expect(otpChallenge.get()).toBeNull();
});
