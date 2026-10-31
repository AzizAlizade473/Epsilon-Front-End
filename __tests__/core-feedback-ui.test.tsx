import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { initializeI18n } from '@/lib/i18n';
import {
  RatingForm,
  type RatingDraft,
} from '@/features/feedback/components/RatingForm';
import { FeedbackConfirmation } from '@/features/feedback/components/FeedbackConfirmation';
import { ReceiptContent } from '@/features/receipts/components/ReceiptContent';
import { feedbackResultSchema, type Receipt } from '@/services/contracts';
import { mockReceipt } from '@/services/mock/fixtures';
import az from '../locales/az.json';

jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));
jest.mock('@shopify/flash-list', () => ({
  FlashList:
    jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));
beforeEach(async () => {
  await initializeI18n();
});
describe('receipt eligibility and amounts', () => {
  it('shows exact server total, quantities and optional hint and locks pending/accepted/rated items', async () => {
    const onRate = jest.fn();
    await render(
      <ReceiptContent
        receipt={mockReceipt}
        pendingIds={['item_01']}
        completedIds={['item_02']}
        onRate={onRate}
        onHome={jest.fn()}
      />,
    );
    expect(screen.getByText(az.feedback.queued)).toBeOnTheScreen();
    expect(screen.getByLabelText('48.50 ₼')).toBeOnTheScreen();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button'));
    expect(onRate).toHaveBeenCalledWith(mockReceipt.items[2]);
  });
  it.each(['claimed', 'expired'] as const)(
    'keeps %s receipts read-only and never invents a reward hint',
    async (status) => {
      const receipt: Receipt = { ...mockReceipt, status };
      delete receipt.rewardHint;
      await render(
        <ReceiptContent
          receipt={receipt}
          pendingIds={[]}
          completedIds={[]}
          onRate={jest.fn()}
          onHome={jest.fn()}
        />,
      );
      expect(screen.queryAllByRole('button')).toHaveLength(1);
      expect(
        screen.getByRole('button', { name: az.feedback.home }),
      ).toBeOnTheScreen();
      expect(screen.queryByText(/keşbek:/)).toBeNull();
    },
  );
  it('renders server-rated stars as read-only', async () => {
    const receipt = {
      ...mockReceipt,
      items: mockReceipt.items.map((item) => ({ ...item, rating: 4 })),
    };
    await render(
      <ReceiptContent
        receipt={receipt}
        pendingIds={[]}
        completedIds={[]}
        onRate={jest.fn()}
        onHome={jest.fn()}
      />,
    );
    expect(screen.getAllByText(az.receipt.rated)).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: az.feedback.home }),
    ).toBeOnTheScreen();
  });
});
describe('rating and reward presentation', () => {
  it('requires a rating, exposes radio semantics and preserves comment while changing rating', async () => {
    function Form() {
      const [draft, setDraft] = useState<RatingDraft>({
        rating: 0,
        comment: '',
        reasonCodes: [],
      });
      return (
        <RatingForm
          itemName="Dish"
          restaurantName="Restaurant"
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
    expect(
      screen.getByRole('button', { name: az.feedback.send }),
    ).toBeDisabled();
    await fireEvent.changeText(
      screen.getByLabelText(az.feedback.comment),
      'My comment',
    );
    const radio = screen.getAllByRole('radio')[1]!;
    await fireEvent.press(radio);
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
    expect(screen.getByText(az.feedback.reasons.taste)).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('radio')[4]!);
    expect(screen.queryByText(az.feedback.reasons.taste)).toBeNull();
    expect(screen.getByDisplayValue('My comment')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: az.feedback.send }),
    ).toBeEnabled();
  });
  it.each(['confirmed', 'pending', 'none'] as const)(
    'shows only backend %s reward details',
    async (status) => {
      await render(
        <FeedbackConfirmation
          result={{
            feedbackId: 'fb',
            reward: {
              status,
              amountMinor: status === 'confirmed' ? 125 : null,
            },
          }}
          itemName="Dish"
          remaining={false}
          onHome={jest.fn()}
          onReceipt={jest.fn()}
        />,
      );
      if (status === 'confirmed')
        expect(screen.getByLabelText('+1.25 ₼')).toBeOnTheScreen();
      else expect(screen.queryByLabelText('+1.25 ₼')).toBeNull();
      expect(Boolean(screen.queryByText(az.feedback.rewardPending))).toBe(
        status === 'pending',
      );
      expect(
        screen.queryByRole('button', { name: az.feedback.otherDish }),
      ).toBeNull();
    },
  );
  it('rejects confirmed results without an amount at the response boundary', () => {
    expect(
      feedbackResultSchema.safeParse({
        feedbackId: 'fb',
        reward: { status: 'confirmed', amountMinor: null },
      }).success,
    ).toBe(false);
  });
  it('offers the receipt only when other eligible dishes remain', async () => {
    const receipt = jest.fn();
    const home = jest.fn();
    await render(
      <FeedbackConfirmation
        result={{
          feedbackId: 'fb',
          reward: { status: 'none', amountMinor: null },
        }}
        itemName="Dish"
        remaining
        onHome={home}
        onReceipt={receipt}
      />,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: az.feedback.otherDish }),
    );
    expect(receipt).toHaveBeenCalledTimes(1);
    await fireEvent.press(
      screen.getByRole('button', { name: az.feedback.home }),
    );
    expect(home).toHaveBeenCalledTimes(1);
  });
});
