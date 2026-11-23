import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { initializeI18n } from '@/lib/i18n';
import { ReceiptContent } from '@/features/receipts/components/ReceiptContent';
import { formatQuantity } from '@/features/receipts/components/DishCard';
import { receiptSchema, type Receipt } from '@/services/contracts';
import az from '../locales/az.json';

// The project ships no @types/node, so type the Node modules used here locally.
const { readdirSync, readFileSync, statSync } = jest.requireActual<{
  readdirSync(path: string): string[];
  readFileSync(path: string, encoding: 'utf8'): string;
  statSync(path: string): { isDirectory(): boolean };
}>('fs');
const { join } = jest.requireActual<{ join(...parts: string[]): string }>(
  'path',
);

jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'live' },
}));
jest.mock('@shopify/flash-list', () => ({
  FlashList:
    jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));
beforeEach(async () => {
  await initializeI18n();
});

/** Shape of the backend's GET /receipts/:id for a scanned fiscal receipt (TAM STORE test fixture). */
const tamStore = (): Receipt =>
  receiptSchema.parse({
    id: '6d2f0c1e-0000-4000-8000-000000000001',
    restaurant: {
      id: 'm-6d2f0c1e',
      name: 'TAM STORE',
      logoUrl: null,
      branchCount: 0,
    },
    branch: { id: 'b-6d2f0c1e', name: 'AZ1025, Bakı şəhəri' },
    issuedAt: '2026-11-16T13:16:02.000Z',
    totalMinor: 237,
    currency: 'AZN',
    status: 'verified',
    items: [
      {
        id: 'i1',
        name: 'COCA COLA ZERO 2LT PET',
        quantity: 1,
        unitPriceMinor: 230,
        canRate: false,
        rating: null,
        line: {
          lineNo: 1,
          originalName: 'COCA COLA ZERO 2LT PET',
          quantityMilli: 1000,
          unit: 'ədəd',
          unitPriceMinor: 230,
          lineTotalMinor: 230,
          cashbackClaimed: false,
        },
      },
      {
        id: 'i2',
        name: 'TS MARKET TORBASI ORTA 3 1X60 SM',
        quantity: 1,
        unitPriceMinor: 7,
        canRate: false,
        rating: null,
        line: {
          lineNo: 2,
          originalName: 'TS MARKET TORBASI ORTA 3 1X60 SM',
          quantityMilli: 1000,
          unit: 'ədəd',
          unitPriceMinor: 7,
          lineTotalMinor: 7,
          cashbackClaimed: false,
        },
      },
    ],
    fiscal: {
      verification: {
        status: 'verified',
        provider: 'e-kassa',
        retrievedAt: '2026-11-21T10:00:00.000Z',
      },
      classification: {
        sector: 'retail',
        businessType: 'supermarket',
        method: 'name_rule',
        status: 'rule',
        evidence: ['supermarket name: "TAM STORE"'],
      },
      partner: { isPartner: false, restaurantId: null, branchId: null },
      eligibility: {
        ratingAllowed: false,
        cashbackAllowed: false,
        reason: 'UNSUPPORTED_MERCHANT_CATEGORY',
      },
      merchant: {
        displayName: 'TAM STORE',
        legalName: 'TAM STORE MMC',
        voen: '1506475881',
        objectName: null,
        objectCode: '1506475881-20001',
        address:
          'AZ1025, Bakı şəhəri, Xətai rayonu, Həsən Salmanı, ev 1, 1-ci mərtəbə, qapı 11',
        city: 'Bakı',
      },
      receipt: {
        fiscalId: 'TESTFISC0001',
        number: '1421',
        documentId: null,
        type: 'sale',
        issuedAt: '2026-11-16T17:16:02+04:00',
        currency: 'AZN',
        totalMinor: 237,
        subtotalMinor: null,
        discountMinor: null,
        vatMinor: 36,
        vatBreakdown: [{ ratePercent: 18, amountMinor: 36 }],
        payment: {
          method: 'cashless',
          cashMinor: 0,
          cashlessMinor: 237,
          bonusMinor: 0,
          changeMinor: 0,
        },
      },
      device: { model: null, serialNumber: null, nmqRegistrationNumber: null },
      additionalFields: {},
    },
  });

const show = (
  receipt: Receipt,
  extra: { onScanAnother?: () => void; onExplore?: () => void } = {},
) =>
  render(
    <ReceiptContent
      receipt={receipt}
      pendingIds={[]}
      completedIds={[]}
      onRate={jest.fn()}
      onHome={jest.fn()}
      {...extra}
    />,
  );

describe('scanned supermarket receipt (valid, not eligible)', () => {
  it('leads with the verified receipt, then explains it is outside the programme, with clear next steps', async () => {
    const onScanAnother = jest.fn();
    const onExplore = jest.fn();
    await show(tamStore(), { onScanAnother, onExplore });
    expect(screen.getByText('TAM STORE')).toBeOnTheScreen();
    expect(screen.getByText(az.notEligible.verified)).toBeOnTheScreen(); // provider-verified
    expect(screen.getByText(az.notEligible.badge)).toBeOnTheScreen();
    expect(
      screen.getByText(
        az.notEligible.title.replace('{{type}}', az.fiscal.type.supermarket),
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText(az.notEligible.body)).toBeOnTheScreen();
    expect(screen.getByText(az.notEligible.whyTitle)).toBeOnTheScreen();
    // Not an error state, and nothing is rateable.
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(az.receipt.rate)).toBeNull();
    // Details stay folded until asked for.
    expect(screen.queryByText('1506475881')).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', { name: az.fiscal.scanAnother }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: az.notEligible.explore }),
    );
    expect(onScanAnother).toHaveBeenCalled();
    expect(onExplore).toHaveBeenCalled();
  });

  it('opens the business, receipt, products and full record on demand', async () => {
    await show(tamStore());
    await fireEvent.press(
      screen.getByRole('button', { name: az.notEligible.details }),
    );
    expect(screen.getByText(az.fiscal.type.supermarket)).toBeOnTheScreen();
    expect(screen.getByText(az.notEligible.reasonValue)).toBeOnTheScreen();
    expect(screen.getByText('1506475881')).toBeOnTheScreen();
    expect(screen.getByText('1506475881-20001')).toBeOnTheScreen();
    expect(screen.getByText('1421')).toBeOnTheScreen();
    expect(screen.getByText('COCA COLA ZERO 2LT PET')).toBeOnTheScreen();
    expect(screen.getByText('1 ədəd × 2.30 ₼')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: az.fiscal.moreDetails }),
    );
    expect(screen.getByText(az.fiscal.cashless)).toBeOnTheScreen();
  });

  it('labels an image-read receipt as read, never as verified', async () => {
    const receipt = tamStore();
    receipt.fiscal!.verification.status = 'official_image';
    await show(receipt);
    expect(screen.getByText(az.notEligible.read)).toBeOnTheScreen();
    expect(screen.queryByText(az.notEligible.verified)).toBeNull();
  });

  it('never presents test fixtures as an official receipt', async () => {
    const receipt = tamStore();
    receipt.fiscal!.verification.status = 'test_data';
    await show(receipt);
    expect(screen.getByText(az.fiscal.testData)).toBeOnTheScreen();
    expect(screen.queryByText(az.fiscal.verified)).toBeNull();
  });
});

describe('scanned restaurant receipt', () => {
  it('lets the customer rate real dishes and explains missing cashback for non-partners', async () => {
    const receipt = tamStore();
    receipt.fiscal!.classification = {
      sector: 'horeca',
      businessType: 'restaurant',
      method: 'name_rule',
      status: 'rule',
      evidence: [],
    };
    receipt.fiscal!.eligibility = {
      ratingAllowed: true,
      cashbackAllowed: false,
      reason: 'NOT_EPSILON_PARTNER',
    };
    receipt.items = receipt.items.map((item) => ({ ...item, canRate: true }));
    await show(receipt);
    // Eligibility first, in plain words; the dishes right below it.
    expect(screen.getByText(az.receipt.nonPartnerTitle)).toBeOnTheScreen();
    expect(screen.getByText(az.receipt.nonPartnerBody)).toBeOnTheScreen();
    expect(screen.getAllByText(az.receipt.tapToRate)).toHaveLength(2);
    expect(
      screen.getByText(
        az.homeFocus.progress
          .replace('{{done}}', '0')
          .replace('{{total}}', '2'),
      ),
    ).toBeOnTheScreen();
    // Business records stay folded away until asked for.
    expect(screen.queryByText(az.fiscal.merchantSection)).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', { name: az.notEligible.details }),
    );
    expect(screen.getByText(az.fiscal.merchantSection)).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: az.fiscal.scanAnother }),
    ).toBeNull();
  });
});

describe('receipt read from a customer image', () => {
  it('is labelled by its source and explains why there is no cashback', async () => {
    const receipt = tamStore();
    receipt.fiscal!.verification.status = 'official_image';
    receipt.fiscal!.classification = {
      sector: 'horeca',
      businessType: 'restaurant',
      method: 'epsilon_partner',
      status: 'verified',
      evidence: [],
    };
    receipt.fiscal!.partner.isPartner = true;
    receipt.fiscal!.eligibility = {
      ratingAllowed: true,
      cashbackAllowed: false,
      reason: 'VERIFICATION_REQUIRED',
    };
    await show(receipt);
    expect(screen.getByText(az.receipt.official)).toBeOnTheScreen();
    expect(screen.queryByText(az.fiscal.verified)).toBeNull();
    expect(
      screen.getByText(az.fiscal.reason.VERIFICATION_REQUIRED),
    ).toBeOnTheScreen();
  });
});

describe('printed quantities', () => {
  it.each([
    [1000, '1'],
    [370, '0.37'],
    [175, '0.175'],
    [2000, '2'],
    [1500, '1.5'],
  ])('%i thousandths → %s', (milli, text) =>
    expect(formatQuantity(milli)).toBe(text),
  );
});

describe('no AI or provider secrets in the app', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name: string) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? files(full) : [full];
    });
  it('never references Gemini keys or calls Gemini from the app', () => {
    const hits = [...files('src'), 'app.config.ts', 'eas.json'].filter((f) =>
      /GEMINI_API_KEY|EXPO_PUBLIC_GEMINI|generativelanguage|@google\/genai|AIza[0-9A-Za-z_-]{20}/.test(
        readFileSync(f, 'utf8'),
      ),
    );
    expect(hits).toEqual([]);
  });
});
