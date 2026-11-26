import { AuthIntentError, type AuthIntent } from '@/lib/auth-intent';
import type { NextStep, User } from '../contracts';
import { mockUser } from './fixtures';
import { ApiError } from '../http/errors';

const accounts = new Map<string, User>([
  [`phone:${mockUser.phone}`, { ...mockUser }],
  [`email:${mockUser.email}`, { ...mockUser }],
  ['google:existing', { ...mockUser }],
]);
let nextAccountId = 0;
export function requireMockIntent(key: string, intent: AuthIntent) {
  const known = accounts.has(key);
  if (intent === 'login' && !known) throw new AuthIntentError('notFound');
  if (intent === 'register' && known) throw new AuthIntentError('exists');
}
/** Combined provider auth: signs in a known identity, provisions an unknown one. */
export function mockAccountOrCreate(key: string, profile: User) {
  return accounts.get(key) ?? mockAccount(key, 'register', profile);
}
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
  return !user.firstName || !user.lastName || !user.birthDate
    ? 'profile'
    : 'home';
}
/** Whether another fixture account already signs in with this address. */
export function mockEmailTaken(email: string, userId: string) {
  const owner = accounts.get(`email:${email}`);
  return owner !== undefined && owner.id !== userId;
}
export function claimMockEmail(email: string, user: User) {
  accounts.set(`email:${email}`, user);
}
export function releaseMockEmail(email: string) {
  accounts.delete(`email:${email}`);
}
export function releaseMockPhone(phone: string | null) {
  if (phone) accounts.delete(`phone:${phone}`);
}
export function forgetMockAccount(user: User) {
  for (const [key, account] of accounts)
    if (account.id === user.id) accounts.delete(key);
}
