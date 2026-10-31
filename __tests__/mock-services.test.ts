/**
 * 03.e — Mock fixtures contract tests & scenario tests.
 *
 * Verifies that:
 * 1. Every mock fixture strictly parses against its respective Zod schema.
 * 2. Mock services respond to scenarios (empty, network error, invalid OTP, claimed receipt, etc.).
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  configSchema,
  receiptSchema,
  restaurantSchema,
  userSchema,
  walletSchema,
  walletTransactionSchema,
} from '@/services/contracts';
import {
  mockConfig,
  mockReceipt,
  mockRestaurants,
  mockTransactions,
  mockUser,
  mockWallet,
} from '@/services/mock/fixtures';
import { setMockLatency, setMockScenario } from '@/services/mock/scenario';
import {
  mockAuthService,
  mockReceiptService,
  mockRestaurantService,
  mockServices,
  mockUserService,
  mockWalletService,
} from '@/services/mock/services';

describe('mock fixtures contract validation', () => {
  it('mockUser conforms to userSchema', () => {
    const parsed = userSchema.safeParse(mockUser);
    expect(parsed.success).toBe(true);
  });

  it('mockConfig conforms to configSchema', () => {
    const parsed = configSchema.safeParse(mockConfig);
    expect(parsed.success).toBe(true);
  });

  it('each mockRestaurant conforms to restaurantSchema', () => {
    for (const restaurant of mockRestaurants) {
      const parsed = restaurantSchema.safeParse(restaurant);
      expect(parsed.success).toBe(true);
    }
  });

  it('mockReceipt conforms to receiptSchema', () => {
    const parsed = receiptSchema.safeParse(mockReceipt);
    expect(parsed.success).toBe(true);
  });

  it('mockWallet conforms to walletSchema', () => {
    const parsed = walletSchema.safeParse(mockWallet);
    expect(parsed.success).toBe(true);
  });

  it('each mockTransaction conforms to walletTransactionSchema', () => {
    for (const tx of mockTransactions) {
      const parsed = walletTransactionSchema.safeParse(tx);
      expect(parsed.success).toBe(true);
    }
  });
});

describe('mock services scenario execution', () => {
  beforeEach(() => {
    setMockScenario('success');
    setMockLatency(0);
  });

  it('returns fixtures in success scenario', async () => {
    const user = await mockUserService.me();
    expect(user.id).toBe(mockUser.id);

    const restaurants = await mockRestaurantService.list();
    expect(restaurants.items.length).toBeGreaterThan(0);

    const wallet = await mockWalletService.get();
    expect(wallet.balanceMinor).toBe(mockWallet.balanceMinor);
  });

  it('returns empty collections in empty scenario', async () => {
    setMockScenario('empty');
    const restaurants = await mockRestaurantService.list();
    expect(restaurants).toEqual({ items: [], nextCursor: null });

    const txs = await mockWalletService.transactions();
    expect(txs.items).toEqual([]);

    const wallet = await mockWalletService.get();
    expect(wallet.balanceMinor).toBe(0);
  });

  it('throws NETWORK error in network_error scenario', async () => {
    setMockScenario('network_error');
    await expect(mockUserService.me()).rejects.toMatchObject({
      code: 'NETWORK',
      status: 0,
    });
  });

  it('throws OTP_INVALID in otp_invalid scenario', async () => {
    setMockScenario('otp_invalid');
    await expect(
      mockAuthService.verifyOtp({ phone: '+994501234567', code: '000000' }),
    ).rejects.toMatchObject({
      code: 'OTP_INVALID',
      status: 400,
    });
  });

  it('throws RECEIPT_ALREADY_CLAIMED in receipt_already_claimed scenario', async () => {
    setMockScenario('receipt_already_claimed');
    await expect(
      mockReceiptService.resolve({ kind: 'qr', value: 'payload_123' }),
    ).rejects.toMatchObject({
      code: 'RECEIPT_ALREADY_CLAIMED',
      status: 409,
    });
  });

  it('mockServices bundle contains all services', () => {
    expect(mockServices.auth).toBeDefined();
    expect(mockServices.user).toBeDefined();
    expect(mockServices.config).toBeDefined();
    expect(mockServices.restaurant).toBeDefined();
    expect(mockServices.receipt).toBeDefined();
    expect(mockServices.feedback).toBeDefined();
    expect(mockServices.wallet).toBeDefined();
    expect(mockServices.notification).toBeDefined();
  });
});
