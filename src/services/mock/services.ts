/**
 * 03.e — Mock services implementation.
 */

import type { User } from '../contracts';
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
    return _currentUser;
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
  async list() {
    await simulateDelay();
    checkMockScenario();
    return getMockScenario() === 'empty' ? [] : mockRestaurants;
  },

  async get(id) {
    await simulateDelay();
    checkMockScenario();
    const found = mockRestaurants.find((r) => r.id === id);
    return found ?? mockRestaurants[0]!;
  },
};

export const mockReceiptService: ReceiptService = {
  async resolve() {
    await simulateDelay();
    checkMockScenario('receipt');
    return mockReceipt;
  },

  async get() {
    await simulateDelay();
    checkMockScenario('receipt');
    return mockReceipt;
  },
};

export const mockFeedbackService: FeedbackService = {
  async submit() {
    await simulateDelay();
    checkMockScenario('feedback');
    return {
      feedbackId: 'fb_mock_123',
      reward: {
        status: 'confirmed',
        amountMinor: 250,
      },
    };
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

  async transactions() {
    await simulateDelay();
    checkMockScenario();
    if (getMockScenario() === 'empty') {
      return { items: [], nextCursor: null };
    }
    return {
      items: mockTransactions,
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
