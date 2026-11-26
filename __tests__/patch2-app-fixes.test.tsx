import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { scanFromURLAsync } from 'expo-camera';
import { launchImageLibraryAsync } from 'expo-image-picker';

import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors } from '@/design';
import { pickQrFromImage } from '@/features/scan/imageQr';
import { scanTransition } from '@/features/scan/machine';
import { supportMailUrl } from '@/lib/support';
import az from '../locales/az.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

jest.mock('expo-camera', () => ({ scanFromURLAsync: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_SUPPORT_EMAIL: 'help@example.test' },
}));

// The project ships no @types/node, so type the two Node modules used here locally.
const { readFileSync, existsSync } = jest.requireActual<{
  readFileSync(path: string, encoding: 'utf8'): string;
  existsSync(path: string): boolean;
}>('fs');
const { join } = jest.requireActual<{ join(...parts: string[]): string }>(
  'path',
);
declare const __dirname: string;
const path = (p: string) => join(__dirname, '..', p);
const read = (p: string) => readFileSync(path(p), 'utf8');

const pick = jest.mocked(launchImageLibraryAsync);
const scan = jest.mocked(scanFromURLAsync);
const codes = (...data: string[]) =>
  data.map((value) => ({ data: value })) as Awaited<
    ReturnType<typeof scanFromURLAsync>
  >;

describe('QR from an uploaded image (22)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pick.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///receipt.jpg', width: 1, height: 1 }],
    });
  });
  it('returns the single code, counting repeated detections once', async () => {
    scan.mockResolvedValue(codes('fiscal', 'fiscal'));
    await expect(pickQrFromImage()).resolves.toEqual({ data: 'fiscal' });
    expect(scan).toHaveBeenCalledWith('file:///receipt.jpg', ['qr']);
  });
  it('distinguishes none, several and unreadable', async () => {
    scan.mockResolvedValue(codes(' '));
    await expect(pickQrFromImage()).resolves.toEqual({ error: 'IMAGE_NO_QR' });
    scan.mockResolvedValue(codes('a', 'b'));
    await expect(pickQrFromImage()).resolves.toEqual({
      error: 'IMAGE_MULTIPLE_QR',
    });
    scan.mockRejectedValue(new Error('decode'));
    await expect(pickQrFromImage()).resolves.toEqual({
      error: 'IMAGE_UNREADABLE',
    });
  });
  it('does nothing when the picker is cancelled', async () => {
    pick.mockResolvedValue({ canceled: true, assets: null });
    await expect(pickQrFromImage()).resolves.toBeNull();
    expect(scan).not.toHaveBeenCalled();
  });
  it('starts a check without camera permission, never over a running one', () => {
    expect(scanTransition('permission-denied', 'detect')).toBe('resolving');
    expect(scanTransition('success', 'detect')).toBe('success');
    expect(scanTransition('error', 'detect')).toBe('error');
  });
});

it('highlights a pressed surface within its corners, without a pale box (13)', async () => {
  await render(
    <PressSurface
      accessibilityLabel="Card"
      onPress={() => undefined}
      style={{ borderRadius: 24 }}
    >
      <Text>Card</Text>
    </PressSurface>,
  );
  expect(
    StyleSheet.flatten(screen.getByRole('button').props.style),
  ).toMatchObject({ borderRadius: 24, overflow: 'hidden' });
  expect(colors.press).toMatch(/^rgba\(.*0\.0\d\)$/);
  expect(read('src/components/ui/PressSurface.tsx')).toContain(
    'pressedColor ?? colors.press',
  );
});

it('draws one wallet card with no stacked layers behind it (6)', () => {
  const card = read('src/components/wallet/WalletSurface.tsx');
  expect(card).not.toMatch(/styles\.(layer|fold|back)\b/);
});

it('shows no invented pairings and no preview label (7, 18)', () => {
  expect(
    read('src/features/restaurants/screens/PublicDishScreen.tsx'),
  ).not.toMatch(/pairing/i);
  expect(existsSync(path('src/components/feedback/MockDataNotice.tsx'))).toBe(
    false,
  );
  for (const locale of [az, en, ru])
    expect(JSON.stringify(locale)).not.toMatch(/"(demoData|pairings)"/);
});

it('keeps "mark all as read" content sized beside the inbox title (11)', () => {
  const inbox = read('src/features/profile/screens/NotificationsScreen.tsx');
  expect(inbox).toMatch(/markAll: \{ marginLeft: 'auto'/);
});

it('asks for the official fiscal receipt QR in every language (14)', () => {
  for (const locale of [az, en, ru]) {
    expect(locale.scan.position).toContain('e-kassa');
    expect(locale.scan.errors.unsupported.body).toContain('e-kassa');
  }
});

it('mails the configured support address with a subject (19)', () => {
  expect(supportMailUrl('Epsilon: help')).toBe(
    'mailto:help@example.test?subject=Epsilon%3A%20help',
  );
});

it('never replaces a tab with a screen above the tabs (12)', () => {
  expect(read('src/features/scan/screens/ScanScreen.tsx')).not.toContain(
    'router.replace({',
  );
  expect(read('src/features/receipts/screens/ReceiptScreen.tsx')).toContain(
    "router.dismissTo('/scan')",
  );
});
