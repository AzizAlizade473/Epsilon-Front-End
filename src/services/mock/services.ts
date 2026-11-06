/**
 * 03.e — Mock services implementation.
 */

import {
  feedbackInputSchema,
  purchaseReferenceSchema,
  type User,
  type FeedbackResult,
  type FeedbackReview,
  type NotificationPreferences,
  type WalletTransaction,
} from '../contracts';
import { ApiError } from '../http/errors';
import type {
  AuthService,
  ConfigService,
  FeedbackService,
  NotificationService,
  ReceiptService,
  RestaurantService,
  ServiceContainer,
  UserService,
  WalletService,
} from '../interfaces';
import {
  mockConfig,
  mockReceipt,
  mockRestaurants,
  mockTransactions,
  mockUser,
  mockWallet,
} from './fixtures';
import { checkMockScenario, getMockScenario, simulateDelay } from './scenario';
import { isE2E } from '@/lib/e2e-mode';
import {
  mockAccount,
  mockAccountStep,
  rememberMockAccount,
  forgetMockAccount,
} from './accounts';

let _currentUser: User = { ...mockUser };
const mockRatings = new Map<string, number>();
const mockFeedbackResults = new Map<string, FeedbackResult>();
const mockReviews: FeedbackReview[] = [];
let mockPreferences: NotificationPreferences = {
  cashbackUpdates: true,
  partnerUpdates: false,
};
export function resetMockFeedback() {
  mockRatings.clear();
  mockFeedbackResults.clear();
  mockReviews.splice(0);
}
const currentReceipt = () => ({
  ...mockReceipt,
  items: mockReceipt.items.map((item) => ({
    ...item,
    rating: mockRatings.get(item.id) ?? item.rating,
  })),
});
function walletFixture(): WalletTransaction[] {
  if (getMockScenario() !== 'wallet_long_history') return mockTransactions;
  return Array.from({ length: 1000 }, (_, index) => ({
    ...mockTransactions[index % mockTransactions.length]!,
    id: `tx_long_${index}`,
    createdAt: new Date(Date.now() - index * 3600000).toISOString(),
  }));
}

export const mockAuthService: AuthService = {
  supportsAuthIntent: true,
  async requestOtp() {
    await simulateDelay();
    checkMockScenario('auth');
    return {
      expiresAt: new Date(Date.now() + 120_000).toISOString(),
      retryAfterSeconds: 60,
    };
  },

  async verifyOtp(input) {
    await simulateDelay();
    checkMockScenario('auth');
    if ((isE2E() || input.intent) && ['000000', '111111'].includes(input.code))
      throw new ApiError({
        code: input.code === '000000' ? 'OTP_INVALID' : 'OTP_EXPIRED',
        message: 'Maestro fixture',
        status: 400,
      });
    if (input.intent)
      _currentUser = mockAccount(`phone:${input.phone}`, input.intent, {
        ...mockUser,
        phone: input.phone,
        email: null,
        phoneVerified: true,
        identities: [mockUser.identities[0]!],
      });
    return {
      session: {
        accessToken: 'mock_access_token_123',
        refreshToken: 'mock_refresh_token_123',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
      user: _currentUser,
      isNewUser: input.intent === 'register',
      nextStep: input.intent ? mockAccountStep(_currentUser) : 'home',
    };
  },

  async signInWithGoogle(input) {
    await simulateDelay();
    checkMockScenario('auth');
    if (isE2E())
      _currentUser = {
        ...mockUser,
        firstName: null,
        lastName: null,
        birthDate: null,
        phoneVerified: false,
      };
    if (input.intent)
      _currentUser = mockAccount(
        input.idToken === 'fixture-new-google' || isE2E()
          ? 'google:new'
          : 'google:existing',
        input.intent,
        {
          ...mockUser,
          phone: null,
          phoneVerified: false,
          identities: [mockUser.identities[1]!],
        },
      );
    return {
      session: {
        accessToken: 'mock_google_access_token',
        refreshToken: 'mock_google_refresh_token',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
      user: _currentUser,
      isNewUser: input.intent ? input.intent === 'register' : isE2E(),
      nextStep: input.intent
        ? mockAccountStep(_currentUser)
        : isE2E()
          ? 'profile'
          : 'home',
    };
  },

  async signInWithApple() {
    throw new Error('Apple Sign-In is disabled on Android');
  },

  async requestPhoneLinkOtp() {
    await simulateDelay();
    checkMockScenario('auth');
    return {
      expiresAt: new Date(Date.now() + 120_000).toISOString(),
      retryAfterSeconds: 60,
    };
  },

  async verifyPhoneLink(input) {
    await simulateDelay();
    checkMockScenario('auth');
    const linked = { ..._currentUser, phone: input.phone, phoneVerified: true };
    rememberMockAccount(linked);
    _currentUser = linked;
    return _currentUser;
  },

  async refresh() {
    await simulateDelay();
    checkMockScenario('auth');
    return {
      accessToken: 'mock_refreshed_access_token',
      refreshToken: 'mock_refreshed_refresh_token',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
  },

  async logout() {
    await simulateDelay();
  },
};

export const mockUserService: UserService = {
  async me() {
    await simulateDelay();
    checkMockScenario();
    return _currentUser;
  },

  async updateProfile(input) {
    await simulateDelay();
    checkMockScenario();
    _currentUser = {
      ..._currentUser,
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
    };
    rememberMockAccount(_currentUser);
    return {
      user: _currentUser,
      nextStep:
        mockConfig.requirePhoneVerification && !_currentUser.phoneVerified
          ? 'phone'
          : 'home',
    };
  },

  async deleteAccount() {
    await simulateDelay();
    checkMockScenario();
    forgetMockAccount(_currentUser);
    _currentUser = { ...mockUser };
    resetMockFeedback();
    mockPreferences = { cashbackUpdates: true, partnerUpdates: false };
  },
};

export const mockConfigService: ConfigService = {
  async get() {
    await simulateDelay();
    checkMockScenario();
    return mockConfig;
  },
};

export const mockRestaurantService: RestaurantService = {
  async list(params) {
    await simulateDelay();
    checkMockScenario();
    const source = getMockScenario() === 'empty' ? [] : mockRestaurants;
    const search = params?.search?.toLocaleLowerCase('az') ?? '';
    const filtered = source.filter((item) =>
      item.name.toLocaleLowerCase('az').includes(search),
    );
    const start = Math.max(0, Number(params?.cursor ?? 0) || 0);
    const limit = params?.limit ?? 20;
    return {
      items: filtered.slice(start, start + limit),
      nextCursor:
        start + limit < filtered.length ? String(start + limit) : null,
    };
  },

  async get(id) {
    await simulateDelay();
    checkMockScenario();
    const found = mockRestaurants.find((r) => r.id === id);
    if (!found)
      throw new ApiError({
        code: 'UNKNOWN',
        message: 'Restaurant unavailable',
        status: 404,
      });
    return found;
  },
};

export const mockReceiptService: ReceiptService = {
  async resolve(input) {
    await simulateDelay();
    checkMockScenario('receipt');
    purchaseReferenceSchema.parse(input);
    if (isE2E()) {
      const codes: Record<
        string,
        | 'RECEIPT_UNSUPPORTED'
        | 'RECEIPT_ALREADY_CLAIMED'
        | 'RECEIPT_EXPIRED'
        | 'NETWORK'
      > = {
        E2E_UNSUPPORTED: 'RECEIPT_UNSUPPORTED',
        E2E_CLAIMED: 'RECEIPT_ALREADY_CLAIMED',
        E2E_EXPIRED: 'RECEIPT_EXPIRED',
        E2E_NETWORK: 'NETWORK',
      };
      const code = codes[input.value];
      if (code)
        throw new ApiError({
          code,
          message: 'Maestro fixture',
          status: code === 'NETWORK' ? 0 : 400,
        });
    }
    return currentReceipt();
  },

  async get(id) {
    await simulateDelay();
    if (id !== mockReceipt.id)
      throw new ApiError({
        code: 'RECEIPT_NOT_FOUND',
        message: 'Unknown mock receipt',
        status: 404,
      });
    const scenario = getMockScenario();
    if (
      scenario === 'receipt_already_claimed' ||
      scenario === 'receipt_expired'
    )
      return {
        ...currentReceipt(),
        status: scenario === 'receipt_expired' ? 'expired' : 'claimed',
      };
    checkMockScenario('receipt');
    return currentReceipt();
  },
};

export const mockFeedbackService: FeedbackService = {
  async submit(input, options) {
    await simulateDelay();
    checkMockScenario('feedback');
    feedbackInputSchema.parse(input);
    const existing = options?.idempotencyKey
      ? mockFeedbackResults.get(options.idempotencyKey)
      : undefined;
    if (existing) return existing;
    const item = mockReceipt.items.find(
      (entry) => entry.id === input.receiptItemId,
    );
    if (!item || !item.canRate)
      throw new ApiError({
        code: 'VALIDATION_FAILED',
        message: 'Unknown mock item',
        status: 422,
      });
    if (mockRatings.has(item.id))
      throw new ApiError({
        code: 'FEEDBACK_ALREADY_SUBMITTED',
        message: 'Duplicate mock rating',
        status: 409,
      });
    const scenario = getMockScenario();
    const status =
      scenario === 'feedback_pending'
        ? 'pending'
        : scenario === 'feedback_none'
          ? 'none'
          : 'confirmed';
    const result: FeedbackResult = {
      feedbackId: `fb_mock_${item.id}`,
      reward: { status, amountMinor: status === 'confirmed' ? 250 : null },
    };
    mockRatings.set(item.id, input.rating);
    mockReviews.unshift({
      feedbackId: result.feedbackId,
      dishName: item.name,
      restaurantName: mockReceipt.restaurant.name,
      rating: input.rating,
      comment: input.comment ?? null,
      createdAt: new Date().toISOString(),
    });
    if (options?.idempotencyKey)
      mockFeedbackResults.set(options.idempotencyKey, result);
    return result;
  },

  async list(params) {
    await simulateDelay();
    checkMockScenario();
    if (getMockScenario() === 'empty') {
      return { items: [], nextCursor: null };
    }
    const start = Math.max(0, Number(params?.cursor ?? 0) || 0);
    const limit = params?.limit ?? 20;
    return {
      items: mockReviews.slice(start, start + limit),
      nextCursor:
        start + limit < mockReviews.length ? String(start + limit) : null,
    };
  },
};

export const mockWalletService: WalletService = {
  async get() {
    await simulateDelay();
    checkMockScenario();
    if (getMockScenario() === 'empty') {
      return { balanceMinor: 0, pendingMinor: 0, currency: 'AZN' };
    }
    // Fixed mock-server projection, never a balance computed by the application.
    return isE2E() && mockRatings.size > 0
      ? { ...mockWallet, balanceMinor: 3700 }
      : mockWallet;
  },

  async transactions(params) {
    await simulateDelay();
    checkMockScenario();
    if (getMockScenario() === 'empty') {
      return { items: [], nextCursor: null };
    }
    const all = walletFixture();
    const start = Math.max(0, Number(params?.cursor ?? 0) || 0);
    const limit = params?.limit ?? 20;
    return {
      items: all.slice(start, start + limit),
      nextCursor: start + limit < all.length ? String(start + limit) : null,
    };
  },

  async transaction(id) {
    await simulateDelay();
    checkMockScenario();
    const found = walletFixture().find((t) => t.id === id);
    if (!found)
      throw new ApiError({
        code: 'UNKNOWN',
        message: 'Transaction not found',
        status: 404,
      });
    return found;
  },
};

export const mockNotificationService: NotificationService = {
  async settings() {
    await simulateDelay();
    checkMockScenario();
    return { ...mockPreferences };
  },
  async updatePreferences(input) {
    await simulateDelay();
    checkMockScenario();
    mockPreferences = { ...input };
    return { ...mockPreferences };
  },
  async registerDevice() {
    await simulateDelay();
  },
};

export const mockServices: ServiceContainer = {
  auth: mockAuthService,
  user: mockUserService,
  config: mockConfigService,
  restaurant: mockRestaurantService,
  receipt: mockReceiptService,
  feedback: mockFeedbackService,
  wallet: mockWalletService,
  notification: mockNotificationService,
};
