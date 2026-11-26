import { expect, test } from '@jest/globals';
import { billCashback, billIdentity, billRatings } from '@/hooks/billView';
import { mockReceipt } from '@/services/mock/fixtures';
import type { Receipt } from '@/services/contracts';

const open: Receipt = {
  ...mockReceipt,
  rewardHint: { amountMinor: 60, currency: 'AZN' },
};
const rated: Receipt = {
  ...open,
  items: open.items.map((item) => ({ ...item, rating: 4, canRate: false })),
};

test('the card names the chain, never the branch', () => {
  const kfc = billIdentity({
    ...open,
    restaurant: { ...open.restaurant, name: 'KFC-VAĞZAL' },
    branch: { id: 'b', name: 'KFC-VAĞZAL' },
  });
  expect(kfc).toEqual({ name: 'KFC', branch: 'Vağzal', logoName: 'KFC' });
  expect(billIdentity(open).name).toBe(open.restaurant.name);
  expect(billIdentity(open).branch).toBe(open.branch.name);
});

test('ratings count what was given', () => {
  expect(billRatings(open)).toMatchObject({ done: 0, average: null });
  expect(billRatings(rated)).toMatchObject({
    done: rated.items.length,
    average: 4,
  });
});

test('recorded money wins over what could be earned', () => {
  expect(billCashback(open)).toEqual({ kind: 'available', amountMinor: 60 });
  expect(
    billCashback({ ...open, cashback: { earnedMinor: 42, pendingMinor: 9 } }),
  ).toEqual({ kind: 'earned', amountMinor: 42 });
  expect(
    billCashback({ ...rated, cashback: { earnedMinor: 0, pendingMinor: 9 } }),
  ).toEqual({ kind: 'pending', amountMinor: 9 });
  // Everything rated and nothing recorded: no amount is invented.
  expect(billCashback(rated)).toBeNull();
  expect(billCashback({ ...open, status: 'expired' })).toBeNull();
});
