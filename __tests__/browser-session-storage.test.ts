import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from '@/lib/session-storage.web';
const mockEnv = {
  EXPO_PUBLIC_APP_ENV: 'development',
  EXPO_PUBLIC_API_MODE: 'mock',
};
jest.mock('@/lib/env', () => ({
  get env() {
    return mockEnv;
  },
}));
beforeEach(async () => {
  mockEnv.EXPO_PUBLIC_APP_ENV = 'development';
  mockEnv.EXPO_PUBLIC_API_MODE = 'mock';
  await deleteItemAsync('session');
});
it('supports a transient mock session and deletion without browser disk storage', async () => {
  expect(await getItemAsync('session')).toBeNull();
  await setItemAsync('session', 'fixture');
  expect(await getItemAsync('session')).toBe('fixture');
  await deleteItemAsync('session');
  expect(await getItemAsync('session')).toBeNull();
});
it.each(['live', 'production'])(
  'rejects %s web sessions and discards prior fixture memory',
  async (mode) => {
    await setItemAsync('session', 'fixture');
    if (mode === 'live') mockEnv.EXPO_PUBLIC_API_MODE = 'live';
    else mockEnv.EXPO_PUBLIC_APP_ENV = 'production';
    await expect(getItemAsync('session')).rejects.toThrow('restricted');
    await expect(setItemAsync('session', 'forbidden')).rejects.toThrow(
      'restricted',
    );
    mockEnv.EXPO_PUBLIC_APP_ENV = 'development';
    mockEnv.EXPO_PUBLIC_API_MODE = 'mock';
    expect(await getItemAsync('session')).toBeNull();
  },
);
