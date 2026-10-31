import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WalletScreen from '@/features/cashback/screens/WalletScreen';
import { TransactionContent } from '@/features/cashback/screens/TransactionScreen';
import { createQueryClient } from '@/services/query';
import { initializeI18n } from '@/lib/i18n';
import { mockTransactions, mockWallet } from '@/services/mock/fixtures';
import type { Paginated, WalletTransaction } from '@/services/contracts';
import az from '../locales/az.json';
const mockPush = jest.fn();
const mockToast = jest.fn();
const mockWalletGet = jest.fn(async () => mockWallet);
const mockList = jest.fn<() => Promise<Paginated<WalletTransaction>>>();
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));
jest.mock('@/services', () => ({
  services: {
    wallet: { get: () => mockWalletGet(), transactions: () => mockList() },
  },
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('@shopify/flash-list', () => ({
  FlashList:
    jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
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
  mockWalletGet.mockReset().mockResolvedValue(mockWallet);
  mockList
    .mockReset()
    .mockResolvedValue({ items: mockTransactions, nextCursor: null });
  await initializeI18n();
});
afterEach(() => client.clear());
async function page(child: React.ReactNode) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>{child}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}
it('renders the server balance independently of transaction totals and opens exact transaction IDs', async () => {
  mockWalletGet.mockResolvedValue({ ...mockWallet, balanceMinor: 98765 });
  await page(<WalletScreen />);
  await waitFor(() =>
    expect(screen.getByLabelText('987.65 ₼')).toBeOnTheScreen(),
  );
  const button = screen
    .getAllByRole('button')
    .find((node) => String(node.props.accessibilityLabel).includes('+2.50'))!;
  await fireEvent.press(button);
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/cashback/transaction/[id]',
    params: { id: 'tx_01' },
  });
});
it('distinguishes empty history from load failure and preserves a cached balance on history errors', async () => {
  mockList.mockRejectedValue(new Error('Offline'));
  await page(<WalletScreen />);
  await waitFor(() =>
    expect(screen.getByText(az.wallet.loadError)).toBeOnTheScreen(),
  );
  expect(screen.queryByText(az.wallet.emptyTitle)).toBeNull();
  expect(screen.getByLabelText('34.50 ₼')).toBeOnTheScreen();
});
it('provides a scan action for an actually empty history', async () => {
  mockList.mockResolvedValue({ items: [], nextCursor: null });
  await page(<WalletScreen />);
  await waitFor(() =>
    expect(screen.getByText(az.wallet.emptyTitle)).toBeOnTheScreen(),
  );
  await fireEvent.press(screen.getByRole('button', { name: az.home.scan }));
  expect(mockPush).toHaveBeenCalledWith('/scan');
});
it('omits null transaction context and reports copy success only after the clipboard succeeds', async () => {
  const transaction = mockTransactions[1]!;
  const copy = jest.fn<(value: string) => Promise<boolean>>(async () => true);
  await page(<TransactionContent transaction={transaction} copy={copy} />);
  expect(screen.queryByText(az.wallet.fields.branch)).toBeNull();
  expect(screen.queryByText(az.wallet.fields.dish)).toBeNull();
  expect(screen.queryByText(az.wallet.fields.receiptId)).toBeNull();
  const button = screen.getByRole('button', {
    name: new RegExp(transaction.id),
  });
  await fireEvent.press(button);
  expect(copy).toHaveBeenCalledWith(transaction.id);
  expect(mockToast).toHaveBeenCalledWith(az.wallet.copied);
});
