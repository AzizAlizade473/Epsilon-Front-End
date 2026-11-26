/**
 * 03.d — Live HTTP service implementations.
 *
 * Implements all domain service interfaces via the HTTP client.
 */

import {
  authResultSchema,
  otpChallengeSchema,
  configSchema,
  feedbackResultSchema,
  feedbackReviewSchema,
  notificationPreferencesSchema,
  notificationPageSchema,
  paginatedSchema,
  profileUpdateResultSchema,
  receiptListSchema,
  receiptSchema,
  restaurantSchema,
  restaurantPageSchema,
  sessionSchema,
  userSchema,
  walletSchema,
  walletTransactionSchema,
  likeResultSchema,
  likeItemSchema,
  likeSnapshotSchema,
  likeStateSchema,
  likeTargetIdSchema,
  type FeedbackInput,
} from '../contracts';
import { request } from '../http/client';
import { requestWithAuth } from '../http/client-with-refresh';
import { generateIdempotencyKey } from '../http/idempotency';
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
import { z } from 'zod';
import { AuthIntentError, type AuthIntent } from '@/lib/auth-intent';
import { ApiError } from './errors';

const voidSchema = z
  .null()
  .or(z.undefined())
  .transform(() => undefined);

/** Epsilon backend answers an intent mismatch with ACCOUNT_NOT_FOUND (404) or
 * ACCOUNT_EXISTS (409); those codes are outside the typed enum, so they arrive
 * as UNKNOWN with that status. Only intent requests are mapped. */
async function withIntent<T>(
  intent: AuthIntent | undefined,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (intent && error instanceof ApiError && error.code === 'UNKNOWN') {
      if (error.status === 404) throw new AuthIntentError('notFound');
      if (error.status === 409) throw new AuthIntentError('exists');
    }
    throw error;
  }
}

export const httpAuthService: AuthService = {
  supportsAuthIntent: true,

  async requestOtp(input) {
    return withIntent(input.intent, () =>
      request('POST', '/auth/otp/request', otpChallengeSchema, input, {
        idempotencyKey: generateIdempotencyKey('otp-req'),
      }),
    );
  },

  async verifyOtp(input) {
    return withIntent(input.intent, () =>
      request('POST', '/auth/otp/verify', authResultSchema, input, {
        idempotencyKey: generateIdempotencyKey('otp-ver'),
      }),
    );
  },

  async signInWithGoogle(input) {
    return withIntent(input.intent, () =>
      request('POST', '/auth/google', authResultSchema, input, {
        idempotencyKey: generateIdempotencyKey('google-auth'),
      }),
    );
  },

  async signInWithApple() {
    throw new Error('Apple Sign-In is disabled on Android');
  },

  async requestPhoneLinkOtp(input) {
    return requestWithAuth(
      'POST',
      '/me/phone/otp/request',
      otpChallengeSchema,
      input,
      {
        idempotencyKey: generateIdempotencyKey('link-req'),
      },
    );
  },

  async verifyPhoneLink(input) {
    return requestWithAuth('POST', '/me/phone/otp/verify', userSchema, input, {
      idempotencyKey: generateIdempotencyKey('link-ver'),
    });
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
  async me(options) {
    return requestWithAuth('GET', '/me', userSchema, undefined, options);
  },

  async updateProfile(input) {
    return requestWithAuth('PATCH', '/me', profileUpdateResultSchema, input, {
      idempotencyKey: generateIdempotencyKey('profile-update'),
    });
  },

  async deleteAccount(options) {
    await requestWithAuth('DELETE', '/me', voidSchema, undefined, {
      ...options,
      idempotencyKey:
        options?.idempotencyKey ?? generateIdempotencyKey('delete-acc'),
    });
  },
};

export const httpConfigService: ConfigService = {
  async get(options) {
    return request('GET', '/config', configSchema, undefined, options);
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

  async list(params, options) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {}))
      if (value !== undefined && value !== '') query.set(key, String(value));
    const qs = query.toString();
    return requestWithAuth(
      'GET',
      qs ? `/receipts?${qs}` : '/receipts',
      receiptListSchema,
      undefined,
      options,
    );
  },

  async importFiscalImage(input, options) {
    return requestWithAuth(
      'POST',
      '/receipts/fiscal/import',
      receiptSchema,
      input,
      {
        ...options,
        // The server reads the image with an AI model: allow for its response time.
        timeoutMs: 120_000,
        idempotencyKey:
          options?.idempotencyKey ?? generateIdempotencyKey('receipt-import'),
      },
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

  async list(params, options) {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    const path = qs ? `/feedback?${qs}` : '/feedback';
    return requestWithAuth(
      'GET',
      path,
      paginatedSchema(feedbackReviewSchema),
      undefined,
      options,
    );
  },

  async get(feedbackId, options) {
    return requestWithAuth(
      'GET',
      `/feedback/${encodeURIComponent(feedbackId)}`,
      feedbackReviewSchema,
      undefined,
      options,
    );
  },

  async update(feedbackId, input, options) {
    return requestWithAuth(
      'PATCH',
      `/feedback/${encodeURIComponent(feedbackId)}`,
      feedbackReviewSchema,
      input,
      options,
    );
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

  async transaction(id, options) {
    return requestWithAuth(
      'GET',
      `/wallet/transactions/${id}`,
      walletTransactionSchema,
      undefined,
      options,
    );
  },
};

export const httpNotificationService: NotificationService = {
  async settings(options) {
    return requestWithAuth(
      'GET',
      '/me/notification-settings',
      notificationPreferencesSchema,
      undefined,
      options,
    );
  },
  async updatePreferences(input, options) {
    return requestWithAuth(
      'PUT',
      '/me/notification-settings',
      notificationPreferencesSchema,
      input,
      {
        ...options,
        idempotencyKey:
          options?.idempotencyKey ?? generateIdempotencyKey('notifications'),
      },
    );
  },
  async registerDevice(token) {
    await requestWithAuth(
      'POST',
      '/devices',
      voidSchema,
      { token },
      {
        idempotencyKey: generateIdempotencyKey('device-reg'),
      },
    );
  },
  async list(params, options) {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return requestWithAuth(
      'GET',
      qs ? `/notifications?${qs}` : '/notifications',
      notificationPageSchema,
      undefined,
      options,
    );
  },
  async markRead(id) {
    await requestWithAuth(
      'POST',
      `/notifications/${encodeURIComponent(id)}/read`,
      voidSchema,
      undefined,
    );
  },
  async markAllRead() {
    await requestWithAuth(
      'POST',
      '/notifications/read-all',
      voidSchema,
      undefined,
    );
  },
};

const likeSegment = (targetId: string) =>
  encodeURIComponent(likeTargetIdSchema.parse(targetId));

export const httpLikeService: LikeService = {
  async like(kind, targetId, snapshot) {
    return requestWithAuth(
      'PUT',
      `/likes/${kind}/${likeSegment(targetId)}`,
      likeResultSchema,
      likeSnapshotSchema.parse(snapshot),
      { idempotencyKey: generateIdempotencyKey('like') },
    );
  },
  async unlike(kind, targetId) {
    return requestWithAuth(
      'DELETE',
      `/likes/${kind}/${likeSegment(targetId)}`,
      likeResultSchema,
      undefined,
      { idempotencyKey: generateIdempotencyKey('unlike') },
    );
  },
  async list(params, options) {
    const query = new URLSearchParams();
    if (params.kind) query.set('kind', params.kind);
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return requestWithAuth(
      'GET',
      qs ? `/likes?${qs}` : '/likes',
      paginatedSchema(likeItemSchema),
      undefined,
      options,
    );
  },
  async state(kind, targetIds, options) {
    return requestWithAuth(
      'POST',
      '/likes/state',
      likeStateSchema,
      { kind, targetIds },
      { ...options, idempotencyKey: generateIdempotencyKey('like-state') },
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
  like: httpLikeService,
};
