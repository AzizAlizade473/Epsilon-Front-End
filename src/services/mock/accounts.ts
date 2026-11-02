import { AuthIntentError, type AuthIntent } from '@/lib/auth-intent';
import type { NextStep, User } from '../contracts';
import { mockConfig, mockUser } from './fixtures';
import { ApiError } from '../http/errors';

const accounts = new Map<string, User>([
  [`phone:${mockUser.phone}`, { ...mockUser }],
  ['google:existing', { ...mockUser }],
]);
let nextAccountId = 0;
export function mockAccount(key: string, intent: AuthIntent, profile: User) {
  const existing = accounts.get(key);
  if (intent === 'login') {
    if (!existing) throw new AuthIntentError('notFound');
    return existing;
  }
  if (existing) throw new AuthIntentError('exists');
  const user = {
    ...profile,
    id: `usr_fixture_${++nextAccountId}`,
    firstName: null,
    lastName: null,
    birthDate: null,
  };
  accounts.set(key, user);
  return user;
}
export function rememberMockAccount(user: User) {
  if (user.phone) {
    const owner = accounts.get(`phone:${user.phone}`);
    if (owner && owner.id !== user.id)
      throw new ApiError({
        code: 'PHONE_IN_USE',
        message: 'Fixture identity conflict',
        status: 409,
      });
    accounts.set(`phone:${user.phone}`, user);
  }
  for (const [key, account] of accounts)
    if (account.id === user.id) accounts.set(key, user);
}
export function mockAccountStep(user: User): NextStep {
  if (!user.firstName || !user.lastName || !user.birthDate) return 'profile';
  return mockConfig.requirePhoneVerification && !user.phoneVerified
    ? 'phone'
    : 'home';
}
export function forgetMockAccount(user: User) {
  for (const [key, account] of accounts)
    if (account.id === user.id) accounts.delete(key);
}
