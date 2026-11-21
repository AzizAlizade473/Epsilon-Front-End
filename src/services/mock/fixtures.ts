/**
 * 03.e — Mock fixtures for domain entities in Azerbaijani.
 * All fixtures strictly adhere to contract schemas.
 */

import { computeCashbackMinor } from '@/lib/cashback';
import type {
  Config,
  Receipt,
  Restaurant,
  User,
  Wallet,
  WalletTransaction,
} from '../contracts';

export const mockUser: User = {
  id: 'usr_azer_001',
  phone: '+994501234567',
  phoneVerified: true,
  email: 'aygun.aliyeva@example.az',
  firstName: 'Aygün',
  lastName: 'Əliyeva',
  birthDate: '1995-04-12',
  language: 'az',
  identities: [
    {
      provider: 'phone',
      email: null,
      emailVerified: false,
      createdAt: '2024-01-10T10:00:00Z',
    },
    {
      provider: 'google',
      email: 'aygun.aliyeva@example.az',
      emailVerified: true,
      createdAt: '2024-01-10T10:05:00Z',
    },
  ],
  createdAt: '2024-01-10T10:00:00Z',
};

export const mockConfig: Config = {
  minAppVersion: '0.1.0',
  minAge: 16,
  requirePhoneVerification: true,
};

export const mockRestaurants: Restaurant[] = [
  {
    id: 'rest_01',
    name: 'Nar & Sharab',
    logoUrl: null,
    branchCount: 3,
  },
  {
    id: 'rest_02',
    name: 'Firuza Kitchen',
    logoUrl: null,
    branchCount: 2,
  },
  {
    id: 'rest_03',
    name: 'Lavash House',
    logoUrl: null,
    branchCount: 4,
  },
  {
    id: 'rest_04',
    name: 'Qala Sofrası',
    logoUrl: null,
    branchCount: 1,
  },
  {
    id: 'rest_05',
    name: 'Tbilisi Courtyard',
    logoUrl: null,
    branchCount: 2,
  },
  {
    id: 'rest_06',
    name: 'Mtkvari Table',
    logoUrl: null,
    branchCount: 1,
  },
  {
    id: 'rest_07',
    name: 'Mangal Atelier',
    logoUrl: null,
    branchCount: 3,
  },
  {
    id: 'rest_08',
    name: 'Bosphorus Grill',
    logoUrl: null,
    branchCount: 2,
  },
  {
    id: 'rest_09',
    name: 'Trattoria Bellavista',
    logoUrl: null,
    branchCount: 2,
  },
  {
    id: 'rest_10',
    name: 'Forno Rosso',
    logoUrl: null,
    branchCount: 1,
  },
  {
    id: 'rest_11',
    name: 'Casa Nonna',
    logoUrl: null,
    branchCount: 1,
  },
  {
    id: 'rest_12',
    name: 'Sumi Izakaya',
    logoUrl: null,
    branchCount: 2,
  },
  {
    id: 'rest_13',
    name: 'Koi Roll Bar',
    logoUrl: null,
    branchCount: 1,
  },
  {
    id: 'rest_14',
    name: 'Ember Steakhouse',
    logoUrl: null,
    branchCount: 3,
  },
  {
    id: 'rest_15',
    name: 'Prime & Smoke',
    logoUrl: null,
    branchCount: 2,
  },
  {
    id: 'rest_16',
    name: 'Caspian Catch',
    logoUrl: null,
    branchCount: 4,
  },
  {
    id: 'rest_17',
    name: 'Blue Anchor',
    logoUrl: null,
    branchCount: 1,
  },
  {
    id: 'rest_18',
    name: 'Pomegranate Café',
    logoUrl: null,
    branchCount: 5,
  },
  {
    id: 'rest_19',
    name: 'Morning Ritual',
    logoUrl: null,
    branchCount: 6,
  },
  {
    id: 'rest_20',
    name: 'Lotus Wok',
    logoUrl: null,
    branchCount: 2,
  },
  {
    id: 'rest_21',
    name: 'Olive Terrace',
    logoUrl: null,
    branchCount: 1,
  },
  {
    id: 'rest_22',
    name: 'Stack Burger Lab',
    logoUrl: null,
    branchCount: 3,
  },
  {
    id: 'rest_23',
    name: 'Maison Lumière',
    logoUrl: null,
    branchCount: 1,
  },
  {
    id: 'rest_24',
    name: 'Saffron Route',
    logoUrl: null,
    branchCount: 2,
  },
  {
    id: 'rest_25',
    name: 'Cedar & Spice',
    logoUrl: null,
    branchCount: 1,
  },
];

/** Every demo reward comes from the one pilot policy, never a hand-typed amount. */
export const demoReward = (receiptTotalMinor: number) =>
  computeCashbackMinor(receiptTotalMinor);

export const mockReceipt: Receipt = {
  id: 'rcpt_789456',
  restaurant: mockRestaurants[0]!,
  branch: {
    id: 'br_paul_fountain',
    name: 'Fəvvarələr Meydanı filialı',
  },
  issuedAt: '2024-02-14T19:30:00Z',
  totalMinor: 4850, // 48.50 ₼
  currency: 'AZN',
  status: 'verified',
  items: [
    {
      id: 'item_01',
      name: 'Kapuçino',
      quantity: 2,
      unitPriceMinor: 800, // 8.00 ₼
      canRate: true,
      rating: null,
    },
    {
      id: 'item_02',
      name: 'Kruasan Badamlı',
      quantity: 2,
      unitPriceMinor: 650, // 6.50 ₼
      canRate: true,
      rating: null,
    },
    {
      id: 'item_03',
      name: 'Fransız Omleti',
      quantity: 1,
      unitPriceMinor: 1950, // 19.50 ₼
      canRate: true,
      rating: null,
    },
  ],
  rewardHint: {
    amountMinor: demoReward(4850),
    currency: 'AZN',
  },
};

// Pending: one verified 15 ₼ receipt. Balance: the confirmed ledger below
// (0.60 + 0.45 earned, 0.20 expired).
export const mockWallet: Wallet = {
  balanceMinor: demoReward(4850) + demoReward(3000) - 20,
  pendingMinor: demoReward(1500),
  currency: 'AZN',
};

export const mockTransactions: WalletTransaction[] = [
  {
    id: 'tx_01',
    type: 'earned',
    status: 'confirmed',
    amountMinor: demoReward(4850), // receipt rcpt_789456, 48.50 ₼
    createdAt: '2024-02-14T20:00:00Z',
    source: {
      restaurantId: 'rest_01',
      restaurantName: 'Nar & Sharab',
      branchName: 'Fəvvarələr Meydanı filialı',
    },
    receiptId: 'rcpt_789456',
    itemName: null,
  },
  {
    id: 'tx_02',
    type: 'earned',
    status: 'confirmed',
    amountMinor: demoReward(3000), // a 30.00 ₼ receipt
    createdAt: '2024-02-10T14:15:00Z',
    source: {
      restaurantId: 'rest_02',
      restaurantName: 'Firuza Kitchen',
      branchName: null,
    },
    receiptId: null,
    itemName: null,
  },
  {
    id: 'tx_pending',
    type: 'earned',
    status: 'pending',
    amountMinor: demoReward(1500), // a 15.00 ₼ receipt, awaiting confirmation
    createdAt: '2024-02-15T09:00:00Z',
    source: {
      restaurantId: 'rest_01',
      restaurantName: 'Nar & Sharab',
      branchName: null,
    },
    receiptId: null,
    itemName: null,
  },
  {
    id: 'tx_reversed',
    type: 'reversed',
    status: 'cancelled',
    amountMinor: -demoReward(1500),
    createdAt: '2024-02-14T21:00:00Z',
    source: null,
    receiptId: null,
    itemName: null,
  },
  {
    id: 'tx_expired',
    type: 'expired',
    status: 'confirmed',
    amountMinor: -20,
    createdAt: '2024-02-14T20:30:00Z',
    source: null,
    receiptId: null,
    itemName: null,
  },
];
