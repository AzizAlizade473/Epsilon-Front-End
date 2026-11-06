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
import { RefreshControl } from 'react-native';
import HomeScreen from '@/features/home/screens/HomeScreen';
import { createQueryClient } from '@/services/query';
import { initializeI18n, i18n } from '@/lib/i18n';
import {
  mockTransactions,
  mockWallet,
  mockReceipt,
} from '@/services/mock/fixtures';
import az from '../locales/az.json';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockWalletGet = jest.fn(async () => mockWallet);
const mockTransactionsGet = jest.fn(async () => ({
  items: mockTransactions,
  nextCursor: null,
}));
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { firstName: 'Test', phoneVerified: true },
    session: {},
    requirePhoneVerification: true,
  }),
}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
    useFocusEffect: (fn: () => void) => React.useEffect(fn, [fn]),
  };
});
jest.mock('@/services', () => ({
  services: {
    receipt: { get: async () => mockReceipt },
    wallet: {
      get: () => mockWalletGet(),
      transactions: () => mockTransactionsGet(),
    },
  },
}));
const client = createQueryClient();
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  mockWalletGet.mockReset().mockResolvedValue(mockWallet);
  mockTransactionsGet
    .mockReset()
    .mockResolvedValue({ items: mockTransactions, nextCursor: null });
  await initializeI18n();
});
afterEach(() => client.clear());
async function home() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>
        <HomeScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}
it('renders server money with speech, pending state and at most three recent rows', async () => {
  mockTransactionsGet.mockResolvedValue({
    items: Array.from({ length: 4 }, (_, index) => ({
      ...mockTransactions[0]!,
      id: `tx-${index}`,
      source: {
        ...mockTransactions[0]!.source!,
        restaurantName: `Demo ${index}`,
      },
    })),
    nextCursor: null,
  });
  await home();
  await waitFor(() =>
    expect(
      screen.getByLabelText(
        i18n.t('home.balanceSpeech', { sign: '', manat: 34, qepik: 50 }),
      ),
    ).toBeOnTheScreen(),
  );
  expect(
    screen.getByText(i18n.t('home.pending', { amount: '2.50 ₼' })),
  ).toBeOnTheScreen();
  expect(screen.getByText('Demo 2')).toBeOnTheScreen();
  expect(screen.queryByText('Demo 3')).toBeNull();
});
it('keeps Scan usable during errors and prevents duplicate modal navigation', async () => {
  mockWalletGet.mockRejectedValue(new Error('unavailable'));
  mockTransactionsGet.mockRejectedValue(new Error('unavailable'));
  await home();
  await waitFor(() =>
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0),
  );
  const scan = screen.getByRole('button', { name: az.home.scan });
  await fireEvent.press(scan);
  await fireEvent.press(scan);
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith('/scan');
  expect(screen.getByRole('button', { name: az.home.viewAll })).toBeEnabled();
});
it('shows an honest empty state and routes the secondary actions to existing screens', async () => {
  mockWalletGet.mockResolvedValue({ ...mockWallet, pendingMinor: 0 });
  mockTransactionsGet.mockResolvedValue({ items: [], nextCursor: null });
  await home();
  await waitFor(() =>
    expect(screen.getByText(az.home.noActivity)).toBeOnTheScreen(),
  );
  await fireEvent.press(screen.getByRole('button', { name: az.home.viewAll }));
  expect(mockNavigate).toHaveBeenCalledWith('/cashback');
  await fireEvent.press(
    screen.getByRole('button', { name: az.navigation.notifications }),
  );
  expect(mockPush).toHaveBeenCalledWith('/profile/notifications');
});
it('refreshes wallet and activity together without replacing cached values by a fake zero', async () => {
  await home();
  await waitFor(() => expect(mockWalletGet).toHaveBeenCalledTimes(1));
  mockWalletGet.mockResolvedValue({ ...mockWallet, balanceMinor: 3565 });
  const refresh = RefreshControl as unknown as {
    latestRef: { props: { onRefresh: () => void } };
  };
  await act(async () => {
    refresh.latestRef.props.onRefresh();
  });
  await waitFor(() => expect(mockWalletGet).toHaveBeenCalledTimes(2));
  expect(mockTransactionsGet).toHaveBeenCalledTimes(2);
  await waitFor(() =>
    expect(
      screen.getByLabelText(
        i18n.t('home.balanceSpeech', { sign: '', manat: 35, qepik: 65 }),
      ),
    ).toBeOnTheScreen(),
  );
});
