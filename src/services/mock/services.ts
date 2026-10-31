/**
 * 03.e — Mock services implementation.
 */

import {
  feedbackInputSchema,
  purchaseReferenceSchema,
  type User,
  type FeedbackResult,
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

let _currentUser: User = { ...mockUser };
const mockRatings = new Map<string, number>();
const mockFeedbackResults = new Map<string, FeedbackResult>();
export function resetMockFeedback() {
  mockRatings.clear();
  mockFeedbackResults.clear();
}
const currentReceipt = () => ({
  ...mockReceipt,
  items: mockReceipt.items.map((item) => ({
    ...item,
    rating: mockRatings.get(item.id) ?? item.rating,
  })),
});

export const mockAuthService: AuthService = {
  async requestOtp() {
    await simulateDelay();
    checkMockScenario('auth');
    return {
      expiresAt: new Date(Date.now() + 120_000).toISOString(),
      retryAfterSeconds: 60,
    };
  },

  async verifyOtp() {
    await simulateDelay();
    checkMockScenario('auth');
    return {
      session: {
        accessToken: 'mock_access_token_123',
        refreshToken: 'mock_refresh_token_123',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
      user: _currentUser,
      isNewUser: false,
      nextStep: 'home',
    };
  },

  async signInWithGoogle() {
    await simulateDelay();
    checkMockScenario('auth');
    return {
      session: {
        accessToken: 'mock_google_access_token',
        refreshToken: 'mock_google_refresh_token',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
      user: _currentUser,
      isNewUser: false,
      nextStep: 'home',
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

  async verifyPhoneLink() {
    await simulateDelay();
    checkMockScenario('auth');
    _currentUser = { ..._currentUser, phoneVerified: true };
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
    _currentUser = { ...mockUser };
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
    return found ?? mockRestaurants[0]!;
  },
};

export const mockReceiptService: ReceiptService = {
  async resolve(input) {
    await simulateDelay();
    checkMockScenario('receipt');
    purchaseReferenceSchema.parse(input);
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
    if (options?.idempotencyKey)
      mockFeedbackResults.set(options.idempotencyKey, result);
    return result;
  },

  async list() {
    await simulateDelay();
    checkMockScenario();
    if (getMockScenario() === 'empty') {
      return { items: [], nextCursor: null };
    }
    return {
      items: [
        {
          feedbackId: 'fb_mock_123',
          reward: {
            status: 'confirmed',
            amountMinor: 250,
          },
        },
      ],
      nextCursor: null,
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
    return mockWallet;
  },

  async transactions(params) {
    await simulateDelay();
    checkMockScenario();
    if (getMockScenario() === 'empty') {
      return { items: [], nextCursor: null };
    }
    return {
      items: mockTransactions.slice(
        0,
        params?.limit ?? mockTransactions.length,
      ),
      nextCursor: null,
    };
  },

  async transaction(id) {
    await simulateDelay();
    checkMockScenario();
    const found = mockTransactions.find((t) => t.id === id);
    return found ?? mockTransactions[0]!;
  },
};

export const mockNotificationService: NotificationService = {
  async settings() {
    await simulateDelay();
    return { pushEnabled: true };
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
