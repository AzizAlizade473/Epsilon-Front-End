import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import PublicDishScreen from '@/features/restaurants/screens/PublicDishScreen';
import { WaitingDishes } from '@/features/home/components/WaitingDishes';
import { readCatalog, readDishReviews } from '@/features/restaurants/catalog';
import { createQueryClient, queryKeys } from '@/services/query';
import { mockReceipt } from '@/services/mock/fixtures';
import { initializeI18n } from '@/lib/i18n';
import az from '../locales/az.json';

let mockAppEnv = 'development';
let mockDishId = '';
jest.mock('@/lib/env', () => ({
  env: {
    get EXPO_PUBLIC_APP_ENV() {
      return mockAppEnv;
    },
    EXPO_PUBLIC_API_MODE: 'mock',
  },
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'rest_01', dishId: mockDishId }),
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  }),
}));
jest.mock('@/services', () => ({
  services: { receipt: { get: async () => mockReceipt } },
}));
jest.mock('@/providers/FeedbackProvider', () => ({
  useFeedback: () => ({
    completedIds: ['item_01'],
    entries: [{ receiptItemId: 'item_02' }],
  }),
}));
const client = createQueryClient();
beforeEach(async () => {
  mockAppEnv = 'development';
  client.clear();
  await initializeI18n();
});
afterEach(() => client.clear());
async function page(children: ReactNode) {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}
it('shows public ratings and reviews without authentication or rating controls', async () => {
  const dish = (await readCatalog('rest_01'))!.dishes[0]!;
  const reviews = (await readDishReviews('rest_01', dish.id))!;
  mockDishId = dish.id;
  await page(<PublicDishScreen />);
  await waitFor(() => expect(screen.getByText(dish.name)).toBeOnTheScreen());
  await waitFor(() =>
    expect(screen.getByText(reviews[0]!.comment)).toBeOnTheScreen(),
  );
  expect(screen.getByText(az.dining.verifiedOnly)).toBeOnTheScreen();
  expect(screen.queryByRole('radiogroup')).toBeNull();
  expect(screen.queryByRole('radio')).toBeNull();
  expect(screen.queryByText(/rate this|qiymət ver$/i)).toBeNull();
});
it('does not substitute sample menus or ratings in production', async () => {
  mockAppEnv = 'production';
  expect(await readCatalog('rest_01')).toBeNull();
  expect(await readDishReviews('rest_01', 'any')).toBeNull();
});
it('only invites feedback on verified purchases that are neither completed nor queued', async () => {
  client.setQueryData(queryKeys.receipt.detail(mockReceipt.id), mockReceipt);
  await page(<WaitingDishes receiptIds={[mockReceipt.id]} />);
  await waitFor(() =>
    expect(
      screen.getByRole('button', {
        name: az.premium.openPurchased.replace(
          '{{name}}',
          mockReceipt.items[2]!.name,
        ),
      }),
    ).toBeOnTheScreen(),
  );
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.queryByRole('radiogroup')).toBeNull();
});
