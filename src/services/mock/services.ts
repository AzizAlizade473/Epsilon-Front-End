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
  type LikeItem,
  type Receipt,
  type ReceiptListParams,
  likeSnapshotSchema,
  likeTargetIdSchema,
} from '../contracts';
import { ApiError } from '../http/errors';
import type {
  AuthService,
  ConfigService,
  FeedbackService,
  LikeService,
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
  mockSupermarketReceipt,
  demoReward,
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
  requireMockIntent,
  mockAccountOrCreate,
} from './accounts';

let _currentUser: User = { ...mockUser };
const mockRatings = new Map<string, number>();
const mockFeedbackResults = new Map<string, FeedbackResult>();
const mockReviews: FeedbackReview[] = [];
let mockPreferences: NotificationPreferences = {
  cashbackUpdates: true,
  partnerUpdates: false,
  reminders: true,
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
function mockPage<T>(all: T[], cursor?: string, limit = 20) {
  const start = Math.max(0, Number(cursor ?? 0) || 0);
  return {
    items: all.slice(start, start + limit),
    nextCursor: start + limit < all.length ? String(start + limit) : null,
  };
}
/** Same meaning as the server filters of GET /receipts. */
function matchesReceipt(receipt: Receipt, params: ReceiptListParams) {
  const fold = (text: string) => text.toLocaleLowerCase('az');
  const text = [
    receipt.id,
    receipt.restaurant.name,
    receipt.branch.name,
    receipt.fiscal?.merchant.objectName,
    receipt.fiscal?.receipt.number,
    receipt.fiscal?.receipt.fiscalId,
    ...receipt.items.map((item) => item.name),
  ];
  // Asia/Baku is UTC+4 all year.
  const day = new Date(Date.parse(receipt.issuedAt) + 4 * 3600_000)
    .toISOString()
    .slice(0, 10);
  const partner = receipt.fiscal?.partner.isPartner ?? true;
  const cashback = receipt.fiscal?.eligibility.cashbackAllowed ?? true;
  return (
    (!params.q ||
      text.some((value) => value && fold(value).includes(fold(params.q!)))) &&
    (!params.from || day >= params.from) &&
    (!params.to || day <= params.to) &&
    (params.partner === undefined || partner === params.partner) &&
    (!params.cashback || cashback === (params.cashback === 'eligible'))
  );
}
const mockLikes = new Map<string, Map<string, LikeItem>>();
function myLikes() {
  let mine = mockLikes.get(_currentUser.id);
  if (!mine) mockLikes.set(_currentUser.id, (mine = new Map()));
  return mine;
}
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
  async requestOtp(input) {
    await simulateDelay();
    checkMockScenario('auth');
    // Like the server: no code at all when the intent cannot succeed.
    if (input.intent) requireMockIntent(`phone:${input.phone}`, input.intent);
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
    const unknown = input.idToken === 'fixture-new-google' || isE2E();
    const key = unknown ? 'google:new' : 'google:existing';
    const profile: User = {
      ...mockUser,
      phone: null,
      phoneVerified: false,
      identities: [mockUser.identities[1]!],
    };
    if (input.intent) _currentUser = mockAccount(key, input.intent, profile);
    else if (unknown) _currentUser = mockAccountOrCreate(key, profile);
    return {
      session: {
        accessToken: 'mock_google_access_token',
        refreshToken: 'mock_google_refresh_token',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      },
      user: _currentUser,
      isNewUser: input.intent
        ? input.intent === 'register'
        : unknown && !_currentUser.firstName,
      nextStep:
        input.intent || unknown ? mockAccountStep(_currentUser) : 'home',
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
    mockLikes.delete(_currentUser.id);
    _currentUser = { ...mockUser };
    resetMockFeedback();
    mockPreferences = {
      cashbackUpdates: true,
      partnerUpdates: false,
      reminders: true,
    };
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
    if (id === mockSupermarketReceipt.id) return mockSupermarketReceipt;
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

  async list(params) {
    await simulateDelay();
    checkMockScenario();
    if (getMockScenario() === 'empty') return { items: [], nextCursor: null };
    const matches = [currentReceipt(), mockSupermarketReceipt]
      .filter((receipt) => matchesReceipt(receipt, params ?? {}))
      .sort((a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt));
    return mockPage(
      matches.map(({ id }) => ({ id })),
      params?.cursor,
      params?.limit,
    );
  },

  // The demo has no receipt reader: never fabricate a reading.
  async importFiscalImage() {
    await simulateDelay();
    throw new ApiError({
      code: 'RECEIPT_READER_UNAVAILABLE',
      message: 'Demo mode cannot read receipt images',
      status: 503,
    });
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
    // One reward per verified receipt: only the first rated item can carry it.
    const firstOnReceipt = mockRatings.size === 0;
    const status = !firstOnReceipt
      ? 'none'
      : scenario === 'feedback_pending'
        ? 'pending'
        : scenario === 'feedback_none'
          ? 'none'
          : 'confirmed';
    const result: FeedbackResult = {
      feedbackId: `fb_mock_${item.id}`,
      reward: {
        status,
        amountMinor:
          status === 'confirmed' ? demoReward(mockReceipt.totalMinor) : null,
      },
    };
    mockRatings.set(item.id, input.rating);
    mockReviews.unshift({
      feedbackId: result.feedbackId,
      receiptId: mockReceipt.id,
      receiptItemId: item.id,
      dishName: item.name,
      restaurantName: mockReceipt.restaurant.name,
      restaurantLogoUrl: null,
      rating: input.rating,
      comment: input.comment ?? null,
      reasonCodes: input.reasonCodes ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: null,
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

  async get(feedbackId) {
    await simulateDelay();
    checkMockScenario();
    const review = mockReviews.find((entry) => entry.feedbackId === feedbackId);
    if (!review)
      throw new ApiError({
        code: 'FEEDBACK_NOT_FOUND',
        message: 'Unknown mock review',
        status: 404,
      });
    return review;
  },

  async update(feedbackId, input) {
    await simulateDelay();
    checkMockScenario('feedback');
    const index = mockReviews.findIndex(
      (entry) => entry.feedbackId === feedbackId,
    );
    if (index < 0)
      throw new ApiError({
        code: 'FEEDBACK_NOT_FOUND',
        message: 'Unknown mock review',
        status: 404,
      });
    const updated: FeedbackReview = {
      ...mockReviews[index]!,
      rating: input.rating,
      comment: input.comment?.trim() || null,
      reasonCodes: input.reasonCodes ?? [],
      updatedAt: new Date().toISOString(),
    };
    mockReviews[index] = updated;
    mockRatings.set(updated.receiptItemId, input.rating);
    return updated;
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
  // Mock builds have no server events: an empty, honest inbox.
  async list() {
    await simulateDelay();
    checkMockScenario();
    return { items: [], nextCursor: null, unreadCount: 0 };
  },
  async markRead() {
    await simulateDelay();
  },
  async markAllRead() {
    await simulateDelay();
  },
};

/** Mock mode only: likes live in memory, per account. */
export const mockLikeService: LikeService = {
  async like(kind, targetId, snapshot) {
    await simulateDelay();
    checkMockScenario();
    const key = `${kind}/${likeTargetIdSchema.parse(targetId)}`;
    if (!myLikes().has(key))
      myLikes().set(key, {
        ...likeSnapshotSchema.parse(snapshot),
        kind,
        targetId,
        createdAt: new Date().toISOString(),
        count: 1,
      });
    return { liked: true, count: 1 };
  },
  async unlike(kind, targetId) {
    await simulateDelay();
    checkMockScenario();
    myLikes().delete(`${kind}/${targetId}`);
    return { liked: false, count: 0 };
  },
  async list(params) {
    await simulateDelay();
    checkMockScenario();
    const all = [...myLikes().values()]
      .filter((item) => !params.kind || item.kind === params.kind)
      .reverse();
    return mockPage(all, params.cursor, params.limit ?? 50);
  },
  async state(kind, targetIds) {
    await simulateDelay();
    checkMockScenario();
    return {
      items: targetIds.map((targetId) => {
        const liked = myLikes().has(`${kind}/${targetId}`);
        return { targetId, liked, count: liked ? 1 : 0 };
      }),
    };
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
  like: mockLikeService,
};
