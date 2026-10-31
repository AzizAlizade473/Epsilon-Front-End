import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Alert, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RateScreen } from '@/features/feedback/screens/RateScreen';
import { FeedbackDoneScreen } from '@/features/feedback/screens/FeedbackDoneScreen';
import type { useFeedback } from '@/providers/FeedbackProvider';
import { createQueryClient, queryKeys } from '@/services/query';
import { initializeI18n } from '@/lib/i18n';
import { mockReceipt } from '@/services/mock/fixtures';
import az from '../locales/az.json';

type State = ReturnType<typeof useFeedback>;
const mockSubmit = jest.fn<State['submit']>();
const mockClear = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
const mockDismissTo = jest.fn();
const mockRouter = {
  back: mockBack,
  replace: mockReplace,
  canGoBack: () => true,
  dismissAll: mockDismissAll,
  dismissTo: mockDismissTo,
};
let mockParams = { receiptItemId: 'item_01', receiptId: mockReceipt.id };
let mockState: State;
let mockBeforeClose: (() => boolean) | undefined;
jest.mock('@/providers/FeedbackProvider', () => ({
  useFeedback: () => mockState,
}));
jest.mock('@/services', () => ({
  services: { receipt: { get: async () => mockReceipt } },
}));
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  Redirect: () => null,
}));
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({
    children,
    onBeforeClose,
  }: {
    children: React.ReactNode;
    onBeforeClose: () => boolean;
  }) => {
    mockBeforeClose = onBeforeClose;
    return children;
  },
}));
const client = createQueryClient();
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  client.setQueryData(queryKeys.receipt.detail(mockReceipt.id), mockReceipt);
  mockParams = { receiptItemId: 'item_01', receiptId: mockReceipt.id };
  mockState = {
    entries: [],
    completedIds: [],
    completion: null,
    submit: mockSubmit,
    clearCompletion: mockClear,
  };
  mockSubmit.mockReset().mockResolvedValue('queued');
  await initializeI18n();
});
afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});
async function flow(child: React.ReactNode) {
  await render(
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
it('blocks arbitrary item IDs and server-ineligible receipts from submission', async () => {
  mockParams.receiptItemId = 'not-purchased';
  await flow(<RateScreen />);
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  expect(mockSubmit).not.toHaveBeenCalled();
});
it('keeps the draft and mutation key across retry and confirms before discarding edits', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  await flow(<RateScreen />);
  expect(mockBeforeClose?.()).toBe(true);
  await fireEvent.changeText(
    screen.getByLabelText(az.feedback.comment),
    'Keep this',
  );
  await fireEvent.press(screen.getAllByRole('radio')[1]!);
  expect(mockBeforeClose?.()).toBe(false);
  expect(alert).toHaveBeenCalledTimes(1);
  expect(mockBack).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: az.feedback.send }));
  expect(screen.getByDisplayValue('Keep this')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: az.feedback.send }));
  expect(mockSubmit).toHaveBeenCalledTimes(2);
  expect(mockSubmit.mock.calls[0]?.[0].idempotencyKey).toBe(
    mockSubmit.mock.calls[1]?.[0].idempotencyKey,
  );
});
it('locks duplicate taps and dismissal until the submit settles, then replaces the sheet', async () => {
  let finish: (result: 'sent') => void = () => undefined;
  mockSubmit.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await flow(<RateScreen />);
  await fireEvent.press(screen.getAllByRole('radio')[4]!);
  await fireEvent.press(screen.getByRole('button', { name: az.feedback.send }));
  await fireEvent.press(screen.getByRole('button', { name: az.feedback.send }));
  expect(mockSubmit).toHaveBeenCalledTimes(1);
  expect(mockBeforeClose?.()).toBe(false);
  await act(() => finish('sent'));
  expect(mockReplace).toHaveBeenCalledWith('/feedback-done');
});
it.each(['home', 'receipt'] as const)(
  'leaves confirmation for %s once and never puts rewards in navigation parameters',
  async (destination) => {
    mockState.completion = {
      entry: {
        receiptId: mockReceipt.id,
        receiptItemId: 'item_01',
        rating: 5,
        idempotencyKey: 'stable',
        createdAt: Date.now(),
      },
      itemName: 'Dish',
      result: {
        feedbackId: 'fb',
        reward: { status: 'confirmed', amountMinor: 250 },
      },
    };
    let back: (() => void) | undefined;
    jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        back = () => handler({ type: 'hardwareBackPress', timeStamp: 0 });
        return { remove: jest.fn() };
      });
    await flow(<FeedbackDoneScreen />);
    if (destination === 'receipt') {
      await fireEvent.press(
        screen.getByRole('button', { name: az.feedback.otherDish }),
      );
      expect(mockDismissTo).toHaveBeenCalledWith({
        pathname: '/receipt/[receiptId]',
        params: { receiptId: mockReceipt.id },
      });
      await act(() => back?.());
      expect(mockDismissAll).not.toHaveBeenCalled();
    } else {
      await act(() => {
        back?.();
        back?.();
      });
      expect(mockDismissAll).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/home');
    }
  },
);
