import { expect, it } from '@jest/globals';
import {
  computeCashbackMinor,
  DEMO_PILOT_POLICY,
  receiptCashbackMinor,
} from '@/lib/cashback';

const azn = (value: number) => Math.round(value * 100);

it.each([
  [8, 10],
  [10, 20],
  [20, 30],
  [25, 40],
  [30, 45],
  [40, 60],
  [60, 60],
  [100, 60],
])('a %d AZN receipt earns %d qəpik', (total, expected) => {
  expect(computeCashbackMinor(azn(total))).toBe(expected);
});

it('rounds exact halves up and applies the minimum only from 10 AZN', () => {
  // 15 AZN: 22.5 qəpik sits exactly between 20 and 25.
  expect(computeCashbackMinor(azn(15))).toBe(25);
  // 9.99 AZN: 14.985 → 15, and no minimum below 10 AZN.
  expect(computeCashbackMinor(999)).toBe(15);
  expect(computeCashbackMinor(1000)).toBe(20);
  expect(computeCashbackMinor(azn(1))).toBe(0);
});

it('caps the reward and never goes above the cap for huge receipts', () => {
  expect(computeCashbackMinor(azn(40))).toBe(DEMO_PILOT_POLICY.capMinor);
  expect(computeCashbackMinor(azn(1_000_000))).toBe(60);
});

it('earns nothing for zero, negative or invalid totals', () => {
  for (const bad of [0, -500, NaN, Infinity, 12.5, 1e20])
    expect(computeCashbackMinor(bad)).toBe(0);
});

it('pays one reward per eligible verified receipt, not per dish', () => {
  const receipt = { totalMinor: 4850, status: 'verified' };
  // Three rated dishes on the same receipt still map to one calculation.
  const perReceipt = receiptCashbackMinor(receipt);
  expect(perReceipt).toBe(60);
  expect([1, 2, 3].map(() => receiptCashbackMinor(receipt))).toEqual([
    60, 60, 60,
  ]);
});

it('pays nothing for unverified receipts, demo data and BHOS', () => {
  expect(receiptCashbackMinor({ totalMinor: 2500, status: 'pending' })).toBe(0);
  expect(receiptCashbackMinor({ totalMinor: 2500, status: 'rejected' })).toBe(
    0,
  );
  expect(
    receiptCashbackMinor({ totalMinor: 2500, status: 'verified', demo: true }),
  ).toBe(0);
  expect(
    receiptCashbackMinor({
      totalMinor: 2500,
      status: 'verified',
      partnerId: 'BHOS',
    }),
  ).toBe(0);
});

it('lets a partner with its own configured policy override the pilot defaults', () => {
  const flat = {
    ratePermille: 100,
    stepMinor: 10,
    minMinor: 0,
    minFromMinor: 0,
    capMinor: 500,
  };
  expect(
    receiptCashbackMinor(
      { totalMinor: 2500, status: 'verified', partnerId: 'rest_x' },
      { rest_x: flat },
    ),
  ).toBe(250);
});
