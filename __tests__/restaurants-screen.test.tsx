import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RestaurantsScreen from '@/features/restaurants/screens/RestaurantsScreen';
import { createQueryClient } from '@/services/query';
import { initializeI18n } from '@/lib/i18n';
import { mockRestaurants } from '@/services/mock/fixtures';
import az from '../locales/az.json';

const mockList = jest.fn(
  async (_params?: { search?: string; cursor?: string }) => ({
    items: mockRestaurants,
    nextCursor: null,
  }),
);
const mockPush = jest.fn();
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));
jest.mock('@/services', () => ({
  services: {
    restaurant: {
      list: (params?: { search?: string; cursor?: string }) => mockList(params),
    },
  },
}));
jest.mock('@shopify/flash-list', () => ({
  FlashList:
    jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ push: mockPush }),
    useFocusEffect: (fn: () => void) => React.useEffect(fn, [fn]),
  };
});
const client = createQueryClient();
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  mockList
    .mockReset()
    .mockResolvedValue({ items: mockRestaurants, nextCursor: null });
  await initializeI18n();
});
afterEach(() => {
  client.clear();
  jest.useRealTimers();
});
async function restaurants() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>
        <RestaurantsScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}
it('opens restaurant profiles and clearly labels development partner data', async () => {
  await restaurants();
  await waitFor(() =>
    expect(screen.getByText(mockRestaurants[0]!.name)).toBeOnTheScreen(),
  );
  const detail = screen.getByRole('button', {
    name: new RegExp(mockRestaurants[0]!.name),
  });
  await fireEvent.press(detail);
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/restaurant/[id]',
    params: { id: mockRestaurants[0]!.id },
  });
  expect(screen.getByText(az.product.demoData)).toBeOnTheScreen();
});
it('distinguishes a real empty directory from a request failure', async () => {
  mockList.mockResolvedValue({ items: [], nextCursor: null });
  await restaurants();
  await waitFor(() =>
    expect(screen.getByText(az.restaurants.empty)).toBeOnTheScreen(),
  );
  expect(screen.queryByRole('button', { name: az.common.retry })).toBeNull();
});
it('offers retry on errors rather than presenting an empty directory', async () => {
  mockList.mockRejectedValueOnce(new Error('offline'));
  await restaurants();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: az.common.retry }),
    ).toBeOnTheScreen(),
  );
  expect(screen.queryByText(az.restaurants.empty)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: az.common.retry }));
  await waitFor(() =>
    expect(screen.getByText(mockRestaurants[0]!.name)).toBeOnTheScreen(),
  );
});
it('debounces search for 300ms, hides stale matches and clears back to cached data', async () => {
  await restaurants();
  await waitFor(() =>
    expect(screen.getByText(mockRestaurants[0]!.name)).toBeOnTheScreen(),
  );
  jest.useFakeTimers();
  await fireEvent.changeText(
    screen.getByLabelText(az.restaurants.search),
    'Absent',
  );
  expect(screen.queryByText(mockRestaurants[0]!.name)).toBeNull();
  await act(async () => {
    await jest.advanceTimersByTimeAsync(299);
  });
  expect(mockList).toHaveBeenCalledTimes(1);
  mockList.mockResolvedValue({ items: [], nextCursor: null });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1);
  });
  await waitFor(() =>
    expect(screen.getByText(az.restaurants.noResults)).toBeOnTheScreen(),
  );
  expect(mockList.mock.calls.at(-1)?.[0]?.search).toBe('Absent');
  await fireEvent.press(
    screen.getByRole('button', { name: az.restaurants.clear }),
  );
  expect(screen.getByText(mockRestaurants[0]!.name)).toBeOnTheScreen();
});
