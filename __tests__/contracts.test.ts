/**
 * 03.a — contract schema tests.
 *
 * Every exported schema must parse its canonical fixture successfully,
 * and must reject clearly invalid inputs.
 */

import { describe, expect, it } from '@jest/globals';

import {
  identitySchema,
  userSchema,
  sessionSchema,
  nextStepSchema,
  authResultSchema,
  configSchema,
  restaurantSchema,
  receiptItemSchema,
  receiptSchema,
  feedbackInputSchema,
  feedbackResultSchema,
  walletSchema,
  walletTransactionSchema,
  paginatedSchema,
} from '@/services/contracts';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const IDENTITY = {
  provider: 'google',
  email: 'aziz@example.com',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
} as const;

const USER = {
  id: 'usr_01',
  phone: '+994501234567',
  phoneVerified: true,
  email: null,
  firstName: 'Aziz',
  lastName: 'Əlizadə',
  birthDate: '1995-06-15',
  language: 'az',
  identities: [IDENTITY],
  createdAt: '2024-01-01T00:00:00Z',
} as const;

const SESSION = {
  accessToken: 'eyJhbGciOiJSUzI1NiJ9.payload.sig',
  refreshToken: 'rt_abc123',
  expiresAt: '2024-01-02T00:00:00Z',
} as const;

const AUTH_RESULT = {
  session: SESSION,
  user: USER,
  isNewUser: false,
  nextStep: 'home',
} as const;

const CONFIG = {
  minAppVersion: '1.0.0',
  minAge: 16,
  requirePhoneVerification: false,
} as const;

const RESTAURANT = {
  id: 'rst_01',
  name: 'Nərgiz',
  logoUrl: 'https://cdn.example.com/logos/nergiz.png',
  branchCount: 3,
} as const;

const RECEIPT_ITEM = {
  id: 'ri_01',
  name: 'Lüləkabab',
  quantity: 2,
  unitPriceMinor: 850,
  canRate: true,
  rating: null,
} as const;

const RECEIPT = {
  id: 'rec_01',
  restaurant: RESTAURANT,
  branch: { id: 'br_01', name: 'Nərgiz Nizami' },
  issuedAt: '2024-01-15T12:30:00Z',
  totalMinor: 1700,
  currency: 'AZN',
  status: 'verified',
  items: [RECEIPT_ITEM],
  rewardHint: { amountMinor: 85, currency: 'AZN' },
} as const;

const FEEDBACK_INPUT = {
  receiptItemId: 'ri_01',
  rating: 4,
  comment: 'Çox dadlı idi!',
  reasonCodes: ['tasty', 'fresh'],
} as const;

const FEEDBACK_RESULT = {
  feedbackId: 'fb_01',
  reward: { status: 'pending', amountMinor: 85 },
} as const;

const WALLET = {
  balanceMinor: 2500,
  pendingMinor: 85,
  currency: 'AZN',
} as const;

const WALLET_TXN = {
  id: 'txn_01',
  type: 'earned',
  status: 'confirmed',
  amountMinor: 85,
  createdAt: '2024-01-15T13:00:00Z',
  source: {
    restaurantId: 'rst_01',
    restaurantName: 'Nərgiz',
    branchName: 'Nərgiz Nizami',
  },
  receiptId: 'rec_01',
  itemName: 'Lüləkabab',
} as const;

// ---------------------------------------------------------------------------
// identitySchema
// ---------------------------------------------------------------------------

describe('identitySchema', () => {
  it('parses a valid google identity', () => {
    expect(identitySchema.parse(IDENTITY)).toMatchObject({
      provider: 'google',
    });
  });

  it('accepts phone provider with null email', () => {
    const result = identitySchema.parse({
      ...IDENTITY,
      provider: 'phone',
      email: null,
      emailVerified: false,
    });
    expect(result.provider).toBe('phone');
    expect(result.email).toBeNull();
  });

  it('rejects unknown provider', () => {
    expect(() =>
      identitySchema.parse({ ...IDENTITY, provider: 'facebook' }),
    ).toThrow();
  });

  it('rejects extra keys (strict)', () => {
    expect(() =>
      identitySchema.parse({ ...IDENTITY, providerUserId: 'secret' }),
    ).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() =>
      identitySchema.parse({ ...IDENTITY, email: 'not-an-email' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// userSchema
// ---------------------------------------------------------------------------

describe('userSchema', () => {
  it('parses a valid user', () => {
    const result = userSchema.parse(USER);
    expect(result.id).toBe('usr_01');
    expect(result.identities).toHaveLength(1);
  });

  it('accepts null nullable fields', () => {
    const sparse = {
      ...USER,
      phone: null,
      email: null,
      firstName: null,
      lastName: null,
      birthDate: null,
    };
    expect(() => userSchema.parse(sparse)).not.toThrow();
  });

  it('rejects missing id', () => {
    const { id: _id, ...noId } = USER;
    expect(() => userSchema.parse(noId)).toThrow();
  });

  it('rejects extra keys (strict)', () => {
    expect(() => userSchema.parse({ ...USER, secret: 'x' })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// sessionSchema
// ---------------------------------------------------------------------------

describe('sessionSchema', () => {
  it('parses a valid session', () => {
    const result = sessionSchema.parse(SESSION);
    expect(result.accessToken).toBe(SESSION.accessToken);
  });

  it('rejects empty accessToken', () => {
    expect(() =>
      sessionSchema.parse({ ...SESSION, accessToken: '' }),
    ).toThrow();
  });

  it('rejects non-ISO expiresAt', () => {
    expect(() =>
      sessionSchema.parse({ ...SESSION, expiresAt: '2024/01/01' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// nextStepSchema
// ---------------------------------------------------------------------------

describe('nextStepSchema', () => {
  it.each(['profile', 'phone', 'home'] as const)(
    'accepts "%s"',
    (value: 'profile' | 'phone' | 'home') => {
      expect(nextStepSchema.parse(value)).toBe(value);
    },
  );

  it('rejects unknown step', () => {
    expect(() => nextStepSchema.parse('dashboard')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// authResultSchema
// ---------------------------------------------------------------------------

describe('authResultSchema', () => {
  it('parses a valid auth result', () => {
    const result = authResultSchema.parse(AUTH_RESULT);
    expect(result.nextStep).toBe('home');
    expect(result.isNewUser).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// configSchema
// ---------------------------------------------------------------------------

describe('configSchema', () => {
  it('parses a valid config', () => {
    const result = configSchema.parse(CONFIG);
    expect(result.minAge).toBe(16);
  });

  it('rejects negative minAge', () => {
    expect(() => configSchema.parse({ ...CONFIG, minAge: -1 })).toThrow();
  });

  it('rejects float minAge', () => {
    expect(() => configSchema.parse({ ...CONFIG, minAge: 16.5 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// restaurantSchema
// ---------------------------------------------------------------------------

describe('restaurantSchema', () => {
  it('parses a valid restaurant', () => {
    expect(restaurantSchema.parse(RESTAURANT)).toMatchObject({ id: 'rst_01' });
  });

  it('accepts null logoUrl', () => {
    expect(() =>
      restaurantSchema.parse({ ...RESTAURANT, logoUrl: null }),
    ).not.toThrow();
  });

  it('rejects empty name', () => {
    expect(() => restaurantSchema.parse({ ...RESTAURANT, name: '' })).toThrow();
  });

  it('rejects negative branchCount', () => {
    expect(() =>
      restaurantSchema.parse({ ...RESTAURANT, branchCount: -1 }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// receiptItemSchema
// ---------------------------------------------------------------------------

describe('receiptItemSchema', () => {
  it('parses a valid item', () => {
    const result = receiptItemSchema.parse(RECEIPT_ITEM);
    expect(result.unitPriceMinor).toBe(850);
    expect(result.rating).toBeNull();
  });

  it('rejects rating outside 1–5', () => {
    expect(() =>
      receiptItemSchema.parse({ ...RECEIPT_ITEM, rating: 6 }),
    ).toThrow();
    expect(() =>
      receiptItemSchema.parse({ ...RECEIPT_ITEM, rating: 0 }),
    ).toThrow();
  });

  it('rejects float unitPriceMinor', () => {
    expect(() =>
      receiptItemSchema.parse({ ...RECEIPT_ITEM, unitPriceMinor: 8.5 }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// receiptSchema
// ---------------------------------------------------------------------------

describe('receiptSchema', () => {
  it('parses a valid receipt with rewardHint', () => {
    const result = receiptSchema.parse(RECEIPT);
    expect(result.status).toBe('verified');
    expect(result.rewardHint?.amountMinor).toBe(85);
  });

  it('parses a receipt without rewardHint', () => {
    const { rewardHint: _rh, ...noHint } = RECEIPT;
    expect(() => receiptSchema.parse(noHint)).not.toThrow();
  });

  it('rejects invalid status', () => {
    expect(() =>
      receiptSchema.parse({ ...RECEIPT, status: 'pending' }),
    ).toThrow();
  });

  it('rejects non-AZN currency', () => {
    expect(() =>
      receiptSchema.parse({ ...RECEIPT, currency: 'USD' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// feedbackInputSchema
// ---------------------------------------------------------------------------

describe('feedbackInputSchema', () => {
  it('parses a valid feedback input', () => {
    const result = feedbackInputSchema.parse(FEEDBACK_INPUT);
    expect(result.rating).toBe(4);
  });

  it('rejects comment longer than 500 chars', () => {
    expect(() =>
      feedbackInputSchema.parse({
        ...FEEDBACK_INPUT,
        comment: 'a'.repeat(501),
      }),
    ).toThrow();
  });

  it('accepts minimal input (no optional fields)', () => {
    expect(() =>
      feedbackInputSchema.parse({ receiptItemId: 'ri_01', rating: 5 }),
    ).not.toThrow();
  });

  it('rejects rating 0 and 6', () => {
    expect(() =>
      feedbackInputSchema.parse({ ...FEEDBACK_INPUT, rating: 0 }),
    ).toThrow();
    expect(() =>
      feedbackInputSchema.parse({ ...FEEDBACK_INPUT, rating: 6 }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// feedbackResultSchema
// ---------------------------------------------------------------------------

describe('feedbackResultSchema', () => {
  it('parses a pending reward', () => {
    expect(feedbackResultSchema.parse(FEEDBACK_RESULT)).toMatchObject({
      reward: { status: 'pending', amountMinor: 85 },
    });
  });

  it('parses a none reward with null amount', () => {
    expect(() =>
      feedbackResultSchema.parse({
        feedbackId: 'fb_02',
        reward: { status: 'none', amountMinor: null },
      }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// walletSchema
// ---------------------------------------------------------------------------

describe('walletSchema', () => {
  it('parses a valid wallet', () => {
    expect(walletSchema.parse(WALLET)).toMatchObject({ currency: 'AZN' });
  });

  it('rejects float balanceMinor', () => {
    expect(() =>
      walletSchema.parse({ ...WALLET, balanceMinor: 25.5 }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// walletTransactionSchema
// ---------------------------------------------------------------------------

describe('walletTransactionSchema', () => {
  it('parses a valid earned transaction', () => {
    const result = walletTransactionSchema.parse(WALLET_TXN);
    expect(result.type).toBe('earned');
    expect(result.source?.branchName).toBe('Nərgiz Nizami');
  });

  it('accepts null source (system adjustment)', () => {
    expect(() =>
      walletTransactionSchema.parse({
        ...WALLET_TXN,
        source: null,
        receiptId: null,
        itemName: null,
      }),
    ).not.toThrow();
  });

  it('rejects invalid type', () => {
    expect(() =>
      walletTransactionSchema.parse({ ...WALLET_TXN, type: 'credit' }),
    ).toThrow();
  });

  it('rejects invalid status', () => {
    expect(() =>
      walletTransactionSchema.parse({ ...WALLET_TXN, status: 'failed' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// paginatedSchema
// ---------------------------------------------------------------------------

describe('paginatedSchema', () => {
  it('parses a page of restaurants with a cursor', () => {
    const schema = paginatedSchema(restaurantSchema);
    const result = schema.parse({
      items: [RESTAURANT],
      nextCursor: 'cursor_abc',
    });
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe('cursor_abc');
  });

  it('parses a last page with null cursor', () => {
    const schema = paginatedSchema(restaurantSchema);
    expect(() => schema.parse({ items: [], nextCursor: null })).not.toThrow();
  });

  it('rejects items that fail inner schema', () => {
    const schema = paginatedSchema(restaurantSchema);
    expect(() =>
      schema.parse({
        items: [{ id: '', name: '', logoUrl: null, branchCount: 0 }],
        nextCursor: null,
      }),
    ).toThrow(); // empty id fails min(1)
  });
});
