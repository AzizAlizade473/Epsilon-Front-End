import { expect, jest, test } from '@jest/globals';
import { demoContent } from '@/lib/demoContent';

const mockEnv: Record<string, unknown> = {};
jest.mock('@/lib/env', () => ({
  get env() {
    return mockEnv;
  },
}));

test.each([
  ['staging', false, false],
  ['staging', true, true],
  ['production', true, false],
])('%s with the demo flag %s shows demo content: %s', (app, flag, shown) => {
  Object.assign(mockEnv, {
    EXPO_PUBLIC_APP_ENV: app,
    EXPO_PUBLIC_API_MODE: 'live',
    EXPO_PUBLIC_DEMO_CATALOG: flag,
  });
  expect(demoContent()).toBe(shown);
});
