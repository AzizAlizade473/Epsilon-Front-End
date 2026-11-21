import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DishReviewsScreen from '@/features/restaurants/screens/DishReviewsScreen';
import { readCatalog, readDishReviews } from '@/features/restaurants/catalog';
import { createQueryClient } from '@/services/query';
import { initializeI18n } from '@/lib/i18n';
import az from '../locales/az.json';

let mockParams: Record<string, string> = {};
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));
jest.mock('@shopify/flash-list', () => ({
  FlashList:
    jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true }),
}));
const client = createQueryClient();
beforeEach(async () => {
  client.clear();
  await initializeI18n();
});

it('pre-filters by the star row the diner tapped and can clear filters', async () => {
  const dish = (await readCatalog('rest_01'))!.dishes[0]!;
  const reviews = (await readDishReviews('rest_01', dish.id))!;
  const stars = reviews[reviews.length - 1]!.rating;
  const matching = reviews.filter((r) => r.rating === stars).length;
  mockParams = { id: 'rest_01', dishId: dish.id, stars: String(stars) };
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>
        <DishReviewsScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  const showing = (count: number) =>
    (count === 1 ? az.dining.showing_one : az.dining.showing_other).replace(
      '{{count}}',
      String(count),
    );
  await waitFor(() =>
    expect(screen.getByText(showing(matching))).toBeOnTheScreen(),
  );
  await fireEvent.press(
    screen.getByRole('button', {
      name: az.dining.filterAll.replace('{{count}}', String(reviews.length)),
    }),
  );
  await waitFor(() =>
    expect(screen.getByText(showing(reviews.length))).toBeOnTheScreen(),
  );
});
