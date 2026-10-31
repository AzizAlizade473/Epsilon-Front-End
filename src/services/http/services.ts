/**
 * 03.d — Live HTTP service implementations.
 *
 * Implements all domain service interfaces via the HTTP client.
 */

import {
  authResultSchema,
  configSchema,
  feedbackResultSchema,
  paginatedSchema,
  profileUpdateResultSchema,
  receiptSchema,
  restaurantSchema,
  restaurantPageSchema,
  sessionSchema,
  userSchema,
  walletSchema,
  walletTransactionSchema,
  type FeedbackInput,
} from '../contracts';
import { request } from '../http/client';
import { requestWithAuth } from '../http/client-with-refresh';
import { generateIdempotencyKey } from '../http/idempotency';
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
import { z } from 'zod';

const otpRequestResponseSchema = z
  .object({
    expiresAt: z.string().datetime({ offset: true }),
    retryAfterSeconds: z.number().int().safe().nonnegative(),
  })
  .strict();

const notificationSettingsSchema = z.object({
  pushEnabled: z.boolean(),
});

const voidSchema = z
  .null()
  .or(z.undefined())
  .transform(() => undefined);

export const httpAuthService: AuthService = {
  async requestOtp(input) {
    return request(
      'POST',
      '/auth/otp/request',
      otpRequestResponseSchema,
      input,
      {
        idempotencyKey: generateIdempotencyKey('otp-req'),
      },
    );
  },

  async verifyOtp(input) {
    return request('POST', '/auth/otp/verify', authResultSchema, input, {
      idempotencyKey: generateIdempotencyKey('otp-ver'),
    });
  },

  async signInWithGoogle(input) {
    return request('POST', '/auth/google', authResultSchema, input, {
      idempotencyKey: generateIdempotencyKey('google-auth'),
    });
  },

  async signInWithApple() {
    throw new Error('Apple Sign-In is disabled on Android');
  },

  async requestPhoneLinkOtp(input) {
    return requestWithAuth(
      'POST',
      '/auth/phone/link/request',
      otpRequestResponseSchema,
      input,
      {
        idempotencyKey: generateIdempotencyKey('link-req'),
      },
    );
  },

  async verifyPhoneLink(input) {
    return requestWithAuth(
      'POST',
      '/auth/phone/link/verify',
      userSchema,
      input,
      {
        idempotencyKey: generateIdempotencyKey('link-ver'),
      },
    );
  },

  async refresh(input) {
    return request('POST', '/auth/refresh', sessionSchema, input, {
      idempotencyKey: generateIdempotencyKey('refresh'),
    });
  },

  async logout() {
    await requestWithAuth('POST', '/auth/logout', voidSchema, undefined, {
      idempotencyKey: generateIdempotencyKey('logout'),
    });
  },
};

export const httpUserService: UserService = {
  async me() {
    return requestWithAuth('GET', '/users/me', userSchema);
  },

  async updateProfile(input) {
    return requestWithAuth(
      'PATCH',
      '/users/me',
      profileUpdateResultSchema,
      input,
      {
        idempotencyKey: generateIdempotencyKey('profile-update'),
      },
    );
  },

  async deleteAccount() {
    await requestWithAuth('DELETE', '/users/me', voidSchema, undefined, {
      idempotencyKey: generateIdempotencyKey('delete-acc'),
    });
  },
};

export const httpConfigService: ConfigService = {
  async get() {
    return request('GET', '/config', configSchema);
  },
};

export const httpRestaurantService: RestaurantService = {
  async list(params, options) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return requestWithAuth(
      'GET',
      qs ? `/restaurants?${qs}` : '/restaurants',
      restaurantPageSchema,
      undefined,
      options,
    );
  },

  async get(id) {
    return requestWithAuth('GET', `/restaurants/${id}`, restaurantSchema);
  },
};

export const httpReceiptService: ReceiptService = {
  async resolve(input, options) {
    return requestWithAuth('POST', '/receipts/resolve', receiptSchema, input, {
      ...options,
      idempotencyKey:
        options?.idempotencyKey ?? generateIdempotencyKey('receipt-resolve'),
    });
  },

  async get(id, options) {
    return requestWithAuth(
      'GET',
      `/receipts/${id}`,
      receiptSchema,
      undefined,
      options,
    );
  },
};

export const httpFeedbackService: FeedbackService = {
  async submit(input: FeedbackInput, options) {
    return requestWithAuth('POST', '/feedback', feedbackResultSchema, input, {
      ...options,
      idempotencyKey:
        options?.idempotencyKey ?? generateIdempotencyKey('feedback'),
    });
  },

  async list(params) {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    const path = qs ? `/feedback?${qs}` : '/feedback';
    return requestWithAuth('GET', path, paginatedSchema(feedbackResultSchema));
  },
};

export const httpWalletService: WalletService = {
  async get(options) {
    return requestWithAuth('GET', '/wallet', walletSchema, undefined, options);
  },

  async transactions(params, options) {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    const path = qs ? `/wallet/transactions?${qs}` : '/wallet/transactions';
    return requestWithAuth(
      'GET',
      path,
      paginatedSchema(walletTransactionSchema),
      undefined,
      options,
    );
  },

  async transaction(id) {
    return requestWithAuth(
      'GET',
      `/wallet/transactions/${id}`,
      walletTransactionSchema,
    );
  },
};

export const httpNotificationService: NotificationService = {
  async settings() {
    return requestWithAuth(
      'GET',
      '/notifications/settings',
      notificationSettingsSchema,
    );
  },

  async registerDevice(token) {
    await requestWithAuth(
      'POST',
      '/notifications/devices',
      voidSchema,
      { token },
      {
        idempotencyKey: generateIdempotencyKey('device-reg'),
      },
    );
  },
};

export const httpServices: ServiceContainer = {
  auth: httpAuthService,
  user: httpUserService,
  config: httpConfigService,
  restaurant: httpRestaurantService,
  receipt: httpReceiptService,
  feedback: httpFeedbackService,
  wallet: httpWalletService,
  notification: httpNotificationService,
};
