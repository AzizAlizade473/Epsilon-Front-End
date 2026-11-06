import { beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ReceiptScreen } from '@/features/receipts/screens/ReceiptScreen';
import type { useFeedback } from '@/providers/FeedbackProvider';
import { createQueryClient, queryKeys } from '@/services/query';
import { mockReceipt } from '@/services/mock/fixtures';
import { initializeI18n } from '@/lib/i18n';
import az from '../locales/az.json';

const mockToast = jest.fn();
const mockClear = jest.fn();
type Completion = NonNullable<ReturnType<typeof useFeedback>['completion']>;
let mockCompletion: Completion | null = null;
jest.mock('@/providers/FeedbackProvider', () => ({
  useFeedback: () => ({
    completion: mockCompletion,
    clearCompletion: mockClear,
    entries: [],
    completedIds: [],
  }),
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('@/services', () => ({
  services: { receipt: { get: async () => mockReceipt } },
}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useLocalSearchParams: () => ({ receiptId: mockReceipt.id }),
    useRouter: () => ({}),
    useFocusEffect: (fn: () => void) => React.useEffect(fn, [fn]),
  };
});
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/receipts/components/ReceiptContent', () => ({
  ReceiptContent: () => null,
}));
const client = createQueryClient();
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  client.setQueryData(queryKeys.receipt.detail(mockReceipt.id), mockReceipt);
  await initializeI18n();
});
afterEach(() => client.clear());

async function show(reward: Completion['result']['reward']) {
  mockCompletion = {
    entry: {
      receiptId: mockReceipt.id,
      receiptItemId: 'item_01',
      rating: 5,
      reasonCodes: [],
      comment: '',
      idempotencyKey: 'review-test',
      createdAt: Date.now(),
    },
    itemName: 'Dish',
    result: { feedbackId: 'feedback-review', reward },
  };
  await render(
    <QueryClientProvider client={client}>
      <ReceiptScreen />
    </QueryClientProvider>,
  );
}
it('celebrates the exact confirmed server reward and announces its amount', async () => {
  await show({ status: 'confirmed', amountMinor: 137 });
  expect(
    screen.getByRole('alert', {
      name: az.feedback.rewardConfirmed + ' +1.37 ₼',
    }),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('+1.37 ₼')).toBeOnTheScreen();
  expect(mockClear).toHaveBeenCalled();
  expect(mockToast).not.toHaveBeenCalled();
});
it('does not celebrate or present pending rewards as credited', async () => {
  await show({ status: 'pending', amountMinor: 137 });
  expect(screen.queryByLabelText('+1.37 ₼')).toBeNull();
  expect(mockToast).toHaveBeenCalledWith(az.feedback.rewardPending);
});
