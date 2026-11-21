/**
 * Epsilon domain contracts — Zod schemas and inferred TypeScript types.
 *
 * Rules:
 *  - Monetary amounts are integer qəpik (never floats). NET-1.
 *  - Dates are ISO-8601 UTC strings validated by Zod.
 *  - Provider user IDs are never sent to the app (SEC-1).
 *  - All schemas are strict (no unexpected keys passed through).
 */

import { z } from 'zod';
import { isAppVersion } from '@/lib/app-version';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** ISO-8601 UTC datetime string (e.g. "2024-01-15T14:30:00Z") */
const isoDate = z.string().datetime({ offset: true });

/** Integer qəpik — must be a safe integer */
const qepik = z.number().int().safe();

/** Currency code — currently only AZN */
const currencyCode = z.enum(['AZN']);

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/**
 * A linked auth provider associated with a user account.
 * Provider user IDs are never sent to the app (SEC-1).
 */
export const identitySchema = z
  .object({
    provider: z.enum(['phone', 'google', 'apple']),
    /** Email associated with this identity, if the provider supplies one. */
    email: z.string().email().nullable(),
    emailVerified: z.boolean(),
    createdAt: isoDate,
  })
  .strict();

export type Identity = z.infer<typeof identitySchema>;

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const userSchema = z
  .object({
    id: z.string().min(1),
    phone: z.string().nullable(),
    phoneVerified: z.boolean(),
    email: z.string().email().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    birthDate: z.string().nullable(), // ISO-8601 date "YYYY-MM-DD"
    language: z.string().min(2).max(10),
    identities: z.array(identitySchema),
    deletionWarning: z.string().min(1).optional(),
    createdAt: isoDate,
  })
  .strict();

export type User = z.infer<typeof userSchema>;

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export const sessionSchema = z
  .object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    /** ISO-8601 UTC expiry; server is authoritative for expiry (NET-5). */
    expiresAt: isoDate,
  })
  .strict();

export type Session = z.infer<typeof sessionSchema>;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** The server-dictated next onboarding step after authentication. */
export const nextStepSchema = z.enum(['profile', 'phone', 'home']);
export type NextStep = z.infer<typeof nextStepSchema>;

export const authResultSchema = z
  .object({
    session: sessionSchema,
    user: userSchema,
    isNewUser: z.boolean(),
    nextStep: nextStepSchema,
  })
  .strict();

export type AuthResult = z.infer<typeof authResultSchema>;

export const otpChallengeSchema = z
  .object({
    expiresAt: isoDate,
    retryAfterSeconds: z.number().int().safe().nonnegative(),
  })
  .strict();

/** Canonical onboarding envelope; legacy User-only APIs remain supported explicitly. */
export const profileUpdateResultSchema = z.union([
  z.object({ user: userSchema, nextStep: nextStepSchema }).strict(),
  userSchema.transform((user) => ({ user, nextStep: null })),
]);
export type ProfileUpdateResult = z.infer<typeof profileUpdateResultSchema>;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const configSchema = z
  .object({
    /** Minimum app version the server accepts (semver string, e.g. "1.2.0"). */
    minAppVersion: z.string().refine(isAppVersion),
    /** Minimum age for account creation; mirrors EXPO_PUBLIC_MIN_AGE but authoritative from server. */
    minAge: z.number().int().positive(),
    /** When true, every account must verify a phone number before reaching home. */
    requirePhoneVerification: z.boolean(),
  })
  .strict();

export type Config = z.infer<typeof configSchema>;

// ---------------------------------------------------------------------------
// Restaurant
// ---------------------------------------------------------------------------

export const restaurantSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    logoUrl: z.string().url().nullable(),
    branchCount: z.number().int().nonnegative(),
  })
  .strict();

export type Restaurant = z.infer<typeof restaurantSchema>;
export const restaurantPageSchema = z.union([
  paginatedSchema(restaurantSchema),
  z.array(restaurantSchema).transform((items) => ({ items, nextCursor: null })),
]);

// ---------------------------------------------------------------------------
// Receipt
// ---------------------------------------------------------------------------

export const receiptItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPriceMinor: qepik,
    /** Whether the current user can submit feedback for this item. */
    canRate: z.boolean(),
    /** Already-submitted rating for this item, or null if not yet rated. */
    rating: z.number().int().min(1).max(5).nullable(),
    /** The printed fiscal receipt line, exactly as the official record states it. */
    line: z
      .object({
        lineNo: z.number().int().positive(),
        originalName: z.string().min(1),
        /** Thousandths: 0.37 kg = 370, 2 pieces = 2000. */
        quantityMilli: z.number().int().positive(),
        unit: z.string().nullable(),
        unitPriceMinor: qepik,
        lineTotalMinor: z.number().int(),
        /** This line's one-time cashback was already taken (by anyone). */
        cashbackClaimed: z.boolean(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type ReceiptItem = z.infer<typeof receiptItemSchema>;

/** Branch information embedded in a receipt response. */
const receiptBranchSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
  })
  .strict();

const minorOrNull = z.number().int().nullable();
const textOrNull = z.string().nullable();
const fiscalInfoSchema = z
  .object({
    verification: z
      .object({
        /**
         * verified = authorised fiscal provider; official_image / paper_photo =
         * read from an image the customer supplied; test_data = local fixture.
         */
        status: z.enum([
          'verified',
          'official_image',
          'paper_photo',
          'test_data',
        ]),
        provider: z.string(),
        /** How the receipt was obtained (see docs/FISCAL_RECEIPTS.md). */
        acquisition: z
          .enum([
            'authorized_fiscal_api',
            'partner_pos_verified',
            'printed_receipt_ocr',
            'customer_supplied_official_image',
            'test_fixture',
          ])
          .optional(),
        /** structured (provider/POS data), on_device_ocr or gemini. */
        engine: z.string().optional(),
        retrievedAt: isoDate,
      })
      .strict(),
    classification: z
      .object({
        sector: z.enum([
          'horeca',
          'retail',
          'healthcare',
          'automotive',
          'services',
          'other',
          'unknown',
        ]),
        businessType: z.string().min(1),
        method: z.enum([
          'epsilon_partner',
          'cache',
          'name_rule',
          'ai_assisted',
          'none',
        ]),
        status: z.enum(['verified', 'rule', 'ai', 'unverified']),
        evidence: z.array(z.string()),
      })
      .strict(),
    partner: z
      .object({
        isPartner: z.boolean(),
        restaurantId: textOrNull,
        branchId: textOrNull,
      })
      .strict(),
    eligibility: z
      .object({
        ratingAllowed: z.boolean(),
        cashbackAllowed: z.boolean(),
        reason: z
          .enum([
            'UNSUPPORTED_MERCHANT_CATEGORY',
            'MERCHANT_CATEGORY_UNKNOWN',
            'NOT_EPSILON_PARTNER',
            'VERIFICATION_REQUIRED',
            'PHONE_NOT_VERIFIED',
          ])
          .nullable(),
      })
      .strict(),
    merchant: z
      .object({
        displayName: z.string().min(1),
        legalName: textOrNull,
        voen: textOrNull,
        objectName: textOrNull,
        objectCode: textOrNull,
        address: textOrNull,
        city: textOrNull,
      })
      .strict(),
    receipt: z
      .object({
        fiscalId: z.string().min(1),
        number: textOrNull,
        documentId: textOrNull,
        type: textOrNull,
        issuedAt: isoDate,
        currency: currencyCode,
        totalMinor: qepik,
        subtotalMinor: minorOrNull,
        discountMinor: minorOrNull,
        vatMinor: minorOrNull,
        vatBreakdown: z.array(
          z
            .object({ ratePercent: z.number(), amountMinor: z.number().int() })
            .strict(),
        ),
        payment: z
          .object({
            method: textOrNull,
            cashMinor: minorOrNull,
            cashlessMinor: minorOrNull,
            bonusMinor: minorOrNull,
            changeMinor: minorOrNull,
          })
          .strict(),
      })
      .strict(),
    device: z
      .object({
        model: textOrNull,
        serialNumber: textOrNull,
        nmqRegistrationNumber: textOrNull,
      })
      .strict(),
    additionalFields: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    ),
  })
  .strict();

export const receiptSchema = z
  .object({
    id: z.string().min(1),
    restaurant: restaurantSchema,
    branch: receiptBranchSchema,
    issuedAt: isoDate,
    totalMinor: qepik,
    currency: currencyCode,
    status: z.enum(['verified', 'claimed', 'expired']),
    items: z.array(receiptItemSchema),
    /** Present for scanned fiscal (e-kassa) receipts; decided entirely by the backend. */
    fiscal: fiscalInfoSchema.optional(),
    /**
     * A hint about the potential reward for submitting feedback.
     * The actual reward is computed and confirmed server-side (SEC-4).
     */
    rewardHint: z
      .object({
        amountMinor: qepik,
        currency: currencyCode,
      })
      .strict()
      .optional(),
  })
  .strict();

export type Receipt = z.infer<typeof receiptSchema>;
export type FiscalInfo = NonNullable<Receipt['fiscal']>;
/** On-device OCR (ML Kit) lines of one photo, with [left, top, right, bottom] boxes. */
export const ocrPageSchema = z
  .object({
    lines: z
      .array(
        z
          .object({
            text: z.string().min(1).max(500),
            box: z.tuple([z.number(), z.number(), z.number(), z.number()]),
          })
          .strict(),
      )
      .max(2000),
  })
  .strict();
export type OcrPage = z.infer<typeof ocrPageSchema>;

/** POST /receipts/fiscal/import: complete a scanned fiscal QR with a customer-supplied image. */
export const fiscalImportSchema = z
  .object({
    qr: z.string().min(1).max(2048),
    /** official_page = image of the official e-kassa receipt; paper_photo = photo of the printed receipt. */
    source: z.enum(['official_page', 'paper_photo']),
    images: z
      .array(
        z
          .object({
            mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
            data: z.string().min(100),
          })
          .strict(),
      )
      .min(1)
      .max(4),
    /** On-device OCR per image, same order; lets the server skip AI when it is enough. */
    ocr: z.array(ocrPageSchema).max(4).optional(),
  })
  .strict();
export type FiscalImport = z.infer<typeof fiscalImportSchema>;
export const receiptListSchema = z
  .object({
    items: z.array(z.object({ id: z.string().min(1) }).strict()),
    nextCursor: z.string().nullable(),
  })
  .strict();
export const purchaseReferenceSchema = z
  .object({
    kind: z.enum(['qr', 'code']),
    value: z
      .string()
      .min(1)
      .max(2048)
      .refine((value) => value.trim().length > 0),
  })
  .strict();
export type PurchaseReference = z.infer<typeof purchaseReferenceSchema>;

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export const feedbackInputSchema = z
  .object({
    receiptItemId: z.string().min(1),
    /** 1–5 star rating */
    rating: z.number().int().min(1).max(5),
    /** Optional free-text comment, max 500 characters */
    comment: z.string().max(500).optional(),
    /** Optional structured reason codes */
    reasonCodes: z.array(z.string().min(1)).max(3).optional(),
  })
  .strict();

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export const feedbackResultSchema = z
  .object({
    feedbackId: z.string().min(1),
    reward: z
      .object({
        status: z.enum(['none', 'pending', 'confirmed']),
        /** Reward amount in qəpik; null when status is "none". */
        amountMinor: qepik.nullable(),
      })
      .strict()
      .refine(
        (reward) =>
          reward.status === 'none'
            ? reward.amountMinor === null
            : reward.status !== 'confirmed' || reward.amountMinor !== null,
        'None requires a null amount; confirmed requires a server amount',
      ),
  })
  .strict();

export type FeedbackResult = z.infer<typeof feedbackResultSchema>;

/** Read model required by My reviews; reward mutation results are not review records. */
export const feedbackReviewSchema = z
  .object({
    feedbackId: z.string().min(1),
    dishName: z.string().min(1),
    restaurantName: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).nullable(),
    createdAt: isoDate,
  })
  .strict();
export type FeedbackReview = z.infer<typeof feedbackReviewSchema>;
export const notificationPreferencesSchema = z
  .object({ cashbackUpdates: z.boolean(), partnerUpdates: z.boolean() })
  .strict();
export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export const walletSchema = z
  .object({
    /** Confirmed balance in qəpik */
    balanceMinor: qepik,
    /** Pending (unconfirmed) balance in qəpik */
    pendingMinor: qepik,
    currency: currencyCode,
  })
  .strict();

export type Wallet = z.infer<typeof walletSchema>;

const transactionSourceSchema = z
  .object({
    restaurantId: z.string().min(1),
    restaurantName: z.string().min(1),
    branchName: z.string().nullable(),
  })
  .strict();

export const walletTransactionSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['earned', 'redeemed', 'reversed', 'expired']),
    status: z.enum(['pending', 'confirmed', 'cancelled']),
    /** Signed amount in qəpik; negative for debits (redeemed/reversed/expired). */
    amountMinor: qepik,
    createdAt: isoDate,
    /** The purchase/restaurant context; null for system adjustments. */
    source: transactionSourceSchema.nullable(),
    receiptId: z.string().nullable(),
    itemName: z.string().nullable(),
  })
  .strict();

export type WalletTransaction = z.infer<typeof walletTransactionSchema>;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Cursor-based pagination wrapper.
 * nextCursor is null when there are no more pages.
 */
export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z
    .object({
      items: z.array(itemSchema),
      nextCursor: z.string().nullable(),
    })
    .strict();
}

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};
