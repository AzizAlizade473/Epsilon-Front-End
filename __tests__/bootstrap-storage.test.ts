import { expect, jest, test } from '@jest/globals';

import { createBootReader, storageKeys } from '@/lib/bootstrap';

const session = {
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
  expiresAt: '2000-01-01T00:00:00Z',
};

test('concurrent boot consumers read tokens once and never apply the device clock', async () => {
  const read = jest.fn(async (key: string) =>
    key === storageKeys.session ? JSON.stringify(session) : 'true',
  );
  const storage = createBootReader(read);
  const [first, second] = await Promise.all([storage.read(), storage.read()]);
  expect(read).toHaveBeenCalledTimes(2);
  expect(first).toBe(second);
  expect(first).toEqual({ session, onboardingComplete: true });
});

test.each([null, '{', '{}', '{"accessToken":false}'])(
  'invalid stored session fails closed',
  async (raw) => {
    const storage = createBootReader(async () => raw);
    expect((await storage.read()).session).toBeNull();
  },
);

test('storage errors can be retried and cached tokens can be released', async () => {
  const read = jest
    .fn<() => Promise<string | null>>()
    .mockRejectedValueOnce(new Error('unavailable'))
    .mockResolvedValue(null);
  const storage = createBootReader(read);
  await expect(storage.read()).rejects.toThrow('unavailable');
  await expect(storage.read()).resolves.toEqual({
    session: null,
    onboardingComplete: false,
  });
  storage.clear();
  await storage.read();
  expect(read).toHaveBeenCalledTimes(6);
});
