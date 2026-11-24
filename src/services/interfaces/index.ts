/**
 * 03.d — Service interfaces.
 *
 * Defines the contract for each domain service so that UI and React Query
 * hooks are decoupled from the implementation (mock vs live HTTP).
 */

import type {
  AuthResult,
  Config,
  FeedbackInput,
  FeedbackResult,
  FeedbackReview,
  FeedbackUpdate,
  NotificationPreferences,
  OtpChallengeResult,
  Paginated,
  ProfileUpdateResult,
  PurchaseReference,
  FiscalImport,
  Receipt,
  Restaurant,
  Session,
  User,
  Wallet,
  WalletTransaction,
} from '../contracts';
import type { AuthIntent } from '@/lib/auth-intent';

export interface AuthService {
  readonly supportsAuthIntent?: boolean;
  requestOtp(input: {
    phone: string;
    intent?: AuthIntent;
    /** Inbox for the code while codes go by e-mail (demo server). */
    email?: string;
  }): Promise<OtpChallengeResult>;
  verifyOtp(input: {
    phone: string;
    code: string;
    intent?: AuthIntent;
  }): Promise<AuthResult>;
  signInWithGoogle(input: {
    idToken: string;
    intent?: AuthIntent;
  }): Promise<AuthResult>;
  signInWithApple(input: { identityToken: string }): Promise<AuthResult>;
  requestPhoneLinkOtp(input: {
    phone: string;
    email?: string;
  }): Promise<OtpChallengeResult>;
  verifyPhoneLink(input: { phone: string; code: string }): Promise<User>;
  refresh(input: { refreshToken: string }): Promise<Session>;
  logout(): Promise<void>;
}

export interface UserService {
  me(options?: ReadOptions): Promise<User>;
  updateProfile(input: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    language?: string;
  }): Promise<ProfileUpdateResult>;
  deleteAccount(options?: MutationOptions): Promise<void>;
}

export interface ConfigService {
  get(options?: ReadOptions): Promise<Config>;
}

export interface RestaurantService {
  list(
    params?: { search?: string; cursor?: string; limit?: number },
    options?: ReadOptions,
  ): Promise<Paginated<Restaurant>>;
  get(id: string): Promise<Restaurant>;
}

export interface ReceiptService {
  resolve(
    input: PurchaseReference,
    options?: MutationOptions,
  ): Promise<Receipt>;
  get(id: string, options?: ReadOptions): Promise<Receipt>;
  /** Ids of the receipts this account holds, newest first (incl. scanned fiscal receipts). */
  list(options?: ReadOptions): Promise<string[]>;
  /** Read a scanned fiscal receipt from an image the customer supplied (server-side AI). */
  importFiscalImage(
    input: FiscalImport,
    options?: MutationOptions,
  ): Promise<Receipt>;
}

export interface FeedbackService {
  submit(
    input: FeedbackInput,
    options?: MutationOptions,
  ): Promise<FeedbackResult>;
  list(
    params?: {
      cursor?: string;
      limit?: number;
    },
    options?: ReadOptions,
  ): Promise<Paginated<FeedbackReview>>;
  get(feedbackId: string, options?: ReadOptions): Promise<FeedbackReview>;
  update(
    feedbackId: string,
    input: FeedbackUpdate,
    options?: MutationOptions,
  ): Promise<FeedbackReview>;
}

export interface WalletService {
  get(options?: ReadOptions): Promise<Wallet>;
  transactions(
    params?: {
      cursor?: string;
      limit?: number;
    },
    options?: ReadOptions,
  ): Promise<Paginated<WalletTransaction>>;
  transaction(id: string, options?: ReadOptions): Promise<WalletTransaction>;
}
export type ReadOptions = { signal?: AbortSignal };
export type MutationOptions = ReadOptions & { idempotencyKey?: string };

export interface NotificationService {
  settings(options?: ReadOptions): Promise<NotificationPreferences>;
  updatePreferences(
    input: NotificationPreferences,
    options?: MutationOptions,
  ): Promise<NotificationPreferences>;
  registerDevice(token: string): Promise<void>;
}

export interface ServiceContainer {
  auth: AuthService;
  user: UserService;
  config: ConfigService;
  restaurant: RestaurantService;
  receipt: ReceiptService;
  feedback: FeedbackService;
  wallet: WalletService;
  notification: NotificationService;
}
