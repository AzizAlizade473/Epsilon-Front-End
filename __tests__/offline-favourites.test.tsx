/** Item 20: favourites without a network, including a cold start. */
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { setLike } from '@/hooks/useLikes';
import { restaurantLike } from '@/hooks/likeTargets';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import type { LikeItem, User } from '@/services/contracts';
import { ApiError } from '@/services/http/errors';
import {
  configureAuthRefresh,
  requestWithAuth,
  resetAuthRefresh,
} from '@/services/http/client-with-refresh';
import { createQueryClient, queryKeys } from '@/services/query';
import {
  clearOfflineFavourites,
  createOfflineFavourites,
  MAX_SNAPSHOT_CHARS,
  offlinePrefix,
} from '@/services/query/offline-favourites';
import type { WalletCacheStorage } from '@/services/query/wallet-cache';
import { mockCatalog } from '@/services/mock/restaurant-catalog';
import { mockRestaurants, mockUser } from '@/services/mock/fixtures';
import { z } from 'zod';

const mockLike = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockMe = jest.fn<() => Promise<User>>();
jest.mock('@/services', () => ({
  services: {
    get like() {
      return { like: mockLike, unlike: mockLike };
    },
    user: { me: () => mockMe() },
    config: {
      get: async () => {
        throw new Error('offline');
      },
    },
    auth: {},
  },
}));
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_URL: 'https://x' },
}));
jest.mock('@/lib/google-signin', () => ({
  initializeGoogle: async () => undefined,
}));

const restaurant = mockRestaurants[0]!;
const catalog = mockCatalog(restaurant.id, 'en')!;
const liked: LikeItem = {
  ...restaurantLike(restaurant.id, restaurant.name, 'Old City').snapshot,
  kind: 'restaurant',
  targetId: restaurant.id,
  createdAt: '2026-11-20T10:00:00.000Z',
  count: 1,
};
const listKey = queryKeys.likes.list('restaurant');
const detailKey = queryKeys.restaurant.detail(restaurant.id);
const catalogKey = ['restaurant', 'catalog', restaurant.id, 'en'];
const dishId = catalog.dishes[0]!.id;
const reviewsKey = ['restaurant', 'reviews', restaurant.id, dishId, 'en'];

function memory() {
  const entries = new Map<string, string>();
  const storage: WalletCacheStorage = {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      entries.set(key, value);
    },
    getAllKeys: async () => [...entries.keys()],
    multiRemove: async (keys) => {
      keys.forEach((key) => entries.delete(key));
    },
  };
  return { entries, storage };
}
const clients: ReturnType<typeof createQueryClient>[] = [];
const copies: ReturnType<typeof createOfflineFavourites>[] = [];
async function open(storage: WalletCacheStorage, owner = 'account') {
  const client = createQueryClient();
  const copy = createOfflineFavourites(client, storage, owner);
  clients.push(client);
  copies.push(copy);
  await copy.start();
  return { client, copy };
}
function seeFavourite(client: ReturnType<typeof createQueryClient>) {
  client.setQueryData(listKey, {
    pages: [{ items: [liked], nextCursor: null }],
    pageParams: [undefined],
  });
}
beforeEach(() => {
  mockLike.mockReset().mockResolvedValue({ liked: true, count: 1 });
});
afterEach(async () => {
  // Unmount first: observers removed after clear() would leave GC timers behind.
  await cleanup();
  copies.splice(0).forEach((copy) => copy.stop());
  clients.splice(0).forEach((client) => client.clear());
  onlineManager.setOnline(true);
  resetAuthRefresh();
});

it('restores a liked restaurant, its menu and seen reviews after a cold start, per account', async () => {
  const { storage, entries } = memory();
  const first = await open(storage);
  // Seen before it was liked: still part of the copy once it is a favourite.
  first.client.setQueryData(detailKey, restaurant);
  first.client.setQueryData(catalogKey, catalog);
  first.client.setQueryData(reviewsKey, []);
  first.client.setQueryData(
    queryKeys.restaurant.detail('not_liked'),
    mockRestaurants[1],
  );
  seeFavourite(first.client);
  await first.copy.persist();
  expect(entries.get(offlinePrefix + 'account')).not.toContain(
    mockRestaurants[1]!.name,
  );
  first.copy.stop();

  onlineManager.setOnline(false);
  const second = await open(storage);
  expect(second.client.getQueryData(detailKey)).toEqual(restaurant);
  expect(second.client.getQueryData(catalogKey)).toEqual(catalog);
  expect(second.client.getQueryData(reviewsKey)).toEqual([]);
  expect(second.client.getQueryData(listKey)).toBeDefined();
  // Restored data is marked old, so it refreshes on reconnect.
  expect(second.client.getQueryState(detailKey)?.dataUpdatedAt).toBe(0);
  // Never invented: a screen that was not seen stays empty.
  expect(
    second.client.getQueryData(['restaurant', 'catalog', restaurant.id, 'ru']),
  ).toBeUndefined();

  const other = await open(storage, 'someone_else');
  expect(other.client.getQueryData(detailKey)).toBeUndefined();
  await clearOfflineFavourites(storage);
  expect(entries.size).toBe(0);
});

it('discards a damaged copy and stays within its size limit', async () => {
  const { storage, entries } = memory();
  entries.set(offlinePrefix + 'account', '{"version":1,"owner":"account"');
  const { client, copy } = await open(storage);
  seeFavourite(client);
  const huge = {
    ...catalog,
    about: 'x'.repeat(MAX_SNAPSHOT_CHARS),
  };
  client.setQueryData(catalogKey, huge);
  client.setQueryData(detailKey, restaurant);
  await copy.persist();
  const raw = entries.get(offlinePrefix + 'account')!;
  expect(raw.length).toBeLessThanOrEqual(MAX_SNAPSHOT_CHARS);
  expect(JSON.parse(raw).records).toHaveLength(1);
});

it('queues an offline unlike across a restart and replays it once on reconnect', async () => {
  const { storage } = memory();
  const first = await open(storage);
  seeFavourite(first.client);
  onlineManager.setOnline(false);
  const target = restaurantLike(restaurant.id, restaurant.name, 'Old City');
  const state = queryKeys.likes.state('restaurant', restaurant.id);
  first.client.setQueryData(state, { liked: true, count: 1 });
  await setLike(first.client, target, false);
  expect(mockLike).not.toHaveBeenCalled();
  expect(first.client.getQueryData(state)).toEqual({ liked: false, count: 0 });
  first.copy.stop();

  const second = await open(storage);
  expect(second.copy.pending()).toHaveLength(1);
  expect(second.client.getQueryData(state)).toMatchObject({ liked: false });
  const send = jest.fn<() => Promise<unknown>>(async () => {
    throw new ApiError({ code: 'NETWORK', message: 'down', status: 0 });
  });
  await second.copy.flush(send);
  expect(second.copy.pending()).toHaveLength(1);
  const ok = jest.fn<(...args: unknown[]) => Promise<unknown>>(
    async () => undefined,
  );
  await expect(second.copy.flush(ok)).resolves.toBe(true);
  expect(ok).toHaveBeenCalledWith(
    'restaurant',
    restaurant.id,
    false,
    target.snapshot,
  );
  expect(second.copy.pending()).toHaveLength(0);
});

it('does not end the session when a token refresh fails without a network', async () => {
  const logout = jest.fn<() => void>();
  configureAuthRefresh({
    refresh: async () => {
      throw new ApiError({ code: 'NETWORK', message: 'down', status: 0 });
    },
    onLogout: logout,
  });
  const original = globalThis.fetch;
  globalThis.fetch = jest.fn(
    async () => new Response('{}', { status: 401 }),
  ) as typeof fetch;
  await expect(requestWithAuth('GET', '/me', z.unknown())).rejects.toBeTruthy();
  globalThis.fetch = original;
  expect(logout).not.toHaveBeenCalled();
});

function Probe() {
  const auth = useAuth();
  return (
    <Text>
      {auth.restoreStatus ?? 'ready'}:{auth.user?.firstName ?? 'none'}
    </Text>
  );
}
it('opens a signed-in app offline from the saved profile', async () => {
  await clearAuthFlows();
  onlineManager.setOnline(false);
  mockMe.mockRejectedValue(
    new ApiError({ code: 'NETWORK', message: 'down', status: 0 }),
  );
  jest
    .mocked(SecureStore.getItemAsync)
    .mockImplementation(async (key) =>
      key === 'epsilon.user'
        ? JSON.stringify({ ...mockUser, firstName: 'Saved', identities: [] })
        : null,
    );
  const client = createQueryClient();
  clients.push(client);
  await render(
    <QueryClientProvider client={client}>
      <AuthProvider
        boot={{
          onboardingComplete: true,
          session: {
            accessToken: 'a',
            refreshToken: 'r',
            expiresAt: '2030-01-01T00:00:00.000Z',
          },
        }}
      >
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText('ready:Saved')).toBeOnTheScreen(),
  );
});
