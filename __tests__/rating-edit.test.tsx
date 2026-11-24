import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RateScreen } from '@/features/feedback/screens/RateScreen';
import {
  RatingForm,
  type RatingDraft,
} from '@/features/feedback/components/RatingForm';
import { createQueryClient } from '@/services/query';
import { initializeI18n } from '@/lib/i18n';
import type { FeedbackReview } from '@/services/contracts';
import az from '../locales/az.json';

const review: FeedbackReview = {
  feedbackId: 'fb_1',
  receiptId: 'r1',
  receiptItemId: 'i1',
  dishName: 'Pendirli sous * 18%',
  restaurantName: 'KFC-VAĞZAL',
  restaurantLogoUrl: null,
  rating: 3,
  comment: 'Fine',
  reasonCodes: ['average_taste'],
  createdAt: '2026-11-22T12:55:00Z',
  updatedAt: null,
};
const mockGet = jest.fn(async () => review);
const mockUpdate = jest.fn(
  async (
    _id: string,
    input: { rating: number; comment?: string; reasonCodes?: string[] },
  ) => ({
    ...review,
    ...input,
    updatedAt: '2026-11-24T10:00:00Z',
  }),
);
jest.mock('@/services', () => ({
  services: {
    feedback: {
      get: () => mockGet(),
      update: (
        id: string,
        input: { rating: number; comment?: string; reasonCodes?: string[] },
      ) => mockUpdate(id, input),
    },
  },
}));
jest.mock('@/providers/FeedbackProvider', () => ({
  useFeedback: () => ({ entries: [], completedIds: [] }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ feedbackId: 'fb_1', receiptItemId: 'i1' }),
}));
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => children,
}));

const client = createQueryClient();
beforeEach(async () => {
  client.clear();
  jest.clearAllMocks();
  await initializeI18n();
});

it('drops quick comments that no longer fit a changed rating and says so', async () => {
  function Form() {
    const [draft, setDraft] = useState<RatingDraft>({
      rating: 0,
      comment: 'keep me',
      reasonCodes: [],
    });
    return (
      <RatingForm
        itemName="Dish"
        draft={draft}
        onChange={setDraft}
        onSubmit={jest.fn()}
        disabled={false}
        busy={false}
        queued={false}
      />
    );
  }
  await render(<Form />);
  await fireEvent.press(screen.getAllByRole('radio')[0]!);
  await fireEvent.press(
    screen.getByRole('button', { name: az.rate.qc.poor_taste }),
  );
  expect(
    screen.getByRole('button', { name: az.rate.qc.poor_taste }),
  ).toHaveProp(
    'accessibilityState',
    expect.objectContaining({ selected: true }),
  );
  await fireEvent.press(screen.getAllByRole('radio')[4]!);
  expect(screen.getByText(az.rate.cleared)).toBeOnTheScreen();
  expect(screen.queryByText(az.rate.qc.poor_taste)).toBeNull();
  expect(screen.getByDisplayValue('keep me')).toBeOnTheScreen();
});

it('edits the same review: pre-filled, saved by id, never a new submission', async () => {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>
        <RateScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  expect(await screen.findByText(az.rate.editEyebrow)).toBeOnTheScreen();
  expect(screen.getAllByRole('radio')[2]).toBeChecked();
  expect(screen.getByDisplayValue('Fine')).toBeOnTheScreen();
  await fireEvent.press(screen.getAllByRole('radio')[3]!);
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: az.rate.save }));
  });
  expect(mockUpdate).toHaveBeenCalledWith('fb_1', {
    rating: 4,
    comment: 'Fine',
    reasonCodes: [],
  });
  expect(await screen.findByText(az.rate.updated)).toBeOnTheScreen();
});
