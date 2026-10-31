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
  Paginated,
  ProfileUpdateResult,
  Receipt,
  Restaurant,
  Session,
  User,
  Wallet,
  WalletTransaction,
} from '../contracts';

export interface AuthService {
  requestOtp(input: {
    phone: string;
  }): Promise<{ expiresAt: string; retryAfterSeconds: number }>;
  verifyOtp(input: { phone: string; code: string }): Promise<AuthResult>;
  signInWithGoogle(input: { idToken: string }): Promise<AuthResult>;
  signInWithApple(input: { identityToken: string }): Promise<AuthResult>;
  requestPhoneLinkOtp(input: {
    phone: string;
  }): Promise<{ expiresAt: string; retryAfterSeconds: number }>;
  verifyPhoneLink(input: { phone: string; code: string }): Promise<User>;
  refresh(input: { refreshToken: string }): Promise<Session>;
  logout(): Promise<void>;
}

export interface UserService {
  me(): Promise<User>;
  updateProfile(input: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    language?: string;
  }): Promise<ProfileUpdateResult>;
  deleteAccount(): Promise<void>;
}

export interface ConfigService {
  get(): Promise<Config>;
}

export interface RestaurantService {
  list(
    params?: { search?: string; cursor?: string; limit?: number },
    options?: ReadOptions,
  ): Promise<Paginated<Restaurant>>;
  get(id: string): Promise<Restaurant>;
}

export interface ReceiptService {
  resolve(qrPayload: string): Promise<Receipt>;
  get(id: string): Promise<Receipt>;
}

export interface FeedbackService {
  submit(input: FeedbackInput): Promise<FeedbackResult>;
  list(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<Paginated<FeedbackResult>>;
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
  transaction(id: string): Promise<WalletTransaction>;
}
export type ReadOptions = { signal?: AbortSignal };

export interface NotificationService {
  settings(): Promise<{ pushEnabled: boolean }>;
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
