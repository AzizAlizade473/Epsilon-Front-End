/**
 * 03.e — Mock fixtures for domain entities in Azerbaijani.
 * All fixtures strictly adhere to contract schemas.
 */

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
    name: 'Demo restoran 1',
    logoUrl: null,
    branchCount: 3,
  },
  {
    id: 'rest_02',
    name: 'Demo restoran 2',
    logoUrl: null,
    branchCount: 2,
  },
  {
    id: 'rest_03',
    name: 'Demo restoran 3',
    logoUrl: null,
    branchCount: 1,
  },
];

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
    amountMinor: 250, // 2.50 ₼
    currency: 'AZN',
  },
};

export const mockWallet: Wallet = {
  balanceMinor: 3450, // 34.50 ₼
  pendingMinor: 250, // 2.50 ₼
  currency: 'AZN',
};

export const mockTransactions: WalletTransaction[] = [
  {
    id: 'tx_01',
    type: 'earned',
    status: 'confirmed',
    amountMinor: 250,
    createdAt: '2024-02-14T20:00:00Z',
    source: {
      restaurantId: 'rest_01',
      restaurantName: 'Demo restoran 1',
      branchName: 'Fəvvarələr Meydanı filialı',
    },
    receiptId: 'rcpt_789456',
    itemName: null,
  },
  {
    id: 'tx_02',
    type: 'redeemed',
    status: 'confirmed',
    amountMinor: -1500,
    createdAt: '2024-02-10T14:15:00Z',
    source: {
      restaurantId: 'rest_02',
      restaurantName: 'Demo restoran 2',
      branchName: null,
    },
    receiptId: null,
    itemName: null,
  },
];
