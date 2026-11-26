/** Items 16 (scan activity), 17 (discovery) and 21 (restaurant replies). */
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScanActivity } from '@/features/home/components/ScanActivity';
import { scanReason } from '@/features/home/scanReason';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import StaffReviewsScreen from '@/features/profile/screens/StaffReviewsScreen';
import RestaurantsScreen from '@/features/restaurants/screens/RestaurantsScreen';
import {
  facets,
  matches,
  noFilters,
  toggle,
  topCuisines,
} from '@/features/restaurants/discovery';
import { OfficialReply } from '@/components/reviews/OfficialReply';
import { setAccessToken } from '@/services/http/client';
import {
  httpFeedbackService,
  httpStaffService,
} from '@/services/http/services';
import { ApiError } from '@/services/http/errors';
import type { ScanAttempt, StaffReview } from '@/services/contracts';
import { mockDirectory } from '@/services/mock/restaurant-catalog';
import { mockRestaurants, mockUser } from '@/services/mock/fixtures';
import { createQueryClient } from '@/services/query';
import { initializeI18n } from '@/lib/i18n';
import az from '../locales/az.json';

type Fn = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const mockPush = jest.fn();
const mockScans: Fn = jest.fn();
const mockResolve: Fn = jest.fn();
const mockReport: Fn = jest.fn();
const mockStaffPlaces: Fn = jest.fn();
const mockStaffReviews: Fn = jest.fn();
const mockReply: Fn = jest.fn();
const mockDeleteReply: Fn = jest.fn();
jest.mock('@/lib/env', () => ({
  env: {
    EXPO_PUBLIC_APP_ENV: 'development',
    EXPO_PUBLIC_API_MODE: 'mock',
    EXPO_PUBLIC_API_URL: 'https://api.test/v1',
  },
}));
jest.mock('@/services', () => ({
  services: {
    activity: { scans: (...a: unknown[]) => mockScans(...a) },
    receipt: { resolve: (...a: unknown[]) => mockResolve(...a) },
    feedback: {
      reportReply: (...a: unknown[]) => mockReport(...a),
      list: async () => ({ items: [], nextCursor: null }),
    },
    staff: {
      restaurants: () => mockStaffPlaces(),
      reviews: (...a: unknown[]) => mockStaffReviews(...a),
      reply: (...a: unknown[]) => mockReply(...a),
      deleteReply: (...a: unknown[]) => mockDeleteReply(...a),
    },
    user: { me: async () => mockUser },
    restaurant: {
      list: async () => ({ items: mockRestaurants, nextCursor: null }),
    },
  },
}));
jest.mock('@/providers/AuthProvider', () => ({
  useAuthActions: () => ({ logout: jest.fn() }),
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => jest.fn() }));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    Redirect: () => null,
    useRouter: () => ({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: () => true,
    }),
    useFocusEffect: (fn: () => void) => React.useEffect(fn, [fn]),
  };
});
jest.mock('@shopify/flash-list', () => ({
  FlashList:
    jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));
// The sheet's gestures and animation have their own tests.
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => children,
}));

const client = createQueryClient();
const originalFetch = globalThis.fetch;
beforeEach(async () => {
  jest.clearAllMocks();
  mockScans.mockResolvedValue({ items: [], nextCursor: null });
  mockStaffPlaces.mockResolvedValue({ items: [] });
  await initializeI18n();
});
afterEach(async () => {
  // Unmount first: observers removed after clear() would leave GC timers behind.
  await cleanup();
  client.clear();
  globalThis.fetch = originalFetch;
  setAccessToken(null);
});
const page = (child: React.ReactNode) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>{child}</QueryClientProvider>
    </SafeAreaProvider>,
  );

const qr = 'https://monitoring.e-kassa.gov.az/#/index?doc=ABCDEF123456';
const failed: ScanAttempt = {
  id: 's1',
  at: '2026-11-25T10:00:00.000Z',
  status: 'failed',
  reason: 'RECEIPT_SOURCE_UNAVAILABLE',
  retryable: true,
  restaurantName: null,
  receiptId: null,
  retryQr: qr,
};
const succeeded: ScanAttempt = {
  ...failed,
  id: 's2',
  status: 'success',
  reason: null,
  retryable: false,
  restaurantName: 'Nar',
  receiptId: 'receipt_1',
  retryQr: null,
};

it('16: classifies reasons, including ones this version does not know', () => {
  expect(scanReason('RECEIPT_UNSUPPORTED').kind).toBe('unsupported');
  expect(scanReason('RECEIPT_EXPIRED').kind).toBe('invalid');
  expect(scanReason('toString')).toEqual({
    key: 'INTERNAL',
    kind: 'temporary',
  });
});
it('16: shows both outcomes, opens a receipt and retries through resolve then the official page', async () => {
  mockScans.mockResolvedValue({
    items: [failed, succeeded],
    nextCursor: null,
  });
  mockResolve.mockRejectedValue(
    new ApiError({
      code: 'RECEIPT_SOURCE_UNAVAILABLE',
      message: 'no source',
      status: 503,
    }),
  );
  await page(<ScanActivity />);
  await waitFor(() =>
    expect(
      screen.getByText(az.scans.reason.RECEIPT_SOURCE_UNAVAILABLE),
    ).toBeOnTheScreen(),
  );
  // Only the retryable failure offers a retry.
  expect(screen.getAllByRole('button', { name: az.scans.retry })).toHaveLength(
    1,
  );
  await fireEvent.press(screen.getByRole('button', { name: /^Nar/ }));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/receipt/[receiptId]',
    params: { receiptId: 'receipt_1' },
  });
  await fireEvent.press(screen.getByRole('button', { name: az.scans.retry }));
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/receipt-import',
      params: { qr },
    }),
  );
  expect(mockResolve).toHaveBeenCalledWith({ kind: 'qr', value: qr });
});
it('16: distinguishes no scans from a failed request', async () => {
  await page(<ScanActivity />);
  await waitFor(() =>
    expect(screen.getByText(az.scans.empty)).toBeOnTheScreen(),
  );
  await screen.unmount();
  client.clear();
  mockScans.mockRejectedValue(new Error('down'));
  await page(<ScanActivity />);
  await waitFor(() =>
    expect(screen.getByText(az.scans.loadError)).toBeOnTheScreen(),
  );
  expect(screen.queryByText(az.scans.empty)).toBeNull();
});

it('17: counts real options only and combines groups', () => {
  const entries = mockDirectory('en');
  const [cuisines, districts] = facets(entries, noFilters);
  expect(cuisines!.options.reduce((n, o) => n + o.count, 0)).toBe(
    entries.length,
  );
  expect(topCuisines(entries)).toHaveLength(4);
  const district = districts!.options[0]!;
  const chosen = toggle(noFilters, 'district', district.value);
  expect(entries.filter((e) => matches(e, chosen))).toHaveLength(
    district.count,
  );
  for (const group of facets(entries, chosen))
    for (const option of group.options) expect(option.count).toBeGreaterThan(0);
  expect(toggle(chosen, 'district', district.value)).toEqual(noFilters);
});
it('17: keeps four shortcuts and filters from the All categories sheet', async () => {
  await page(<RestaurantsScreen />);
  const all = await screen.findByRole('button', { name: az.discovery.all });
  await fireEvent.press(all);
  const price = await screen.findAllByRole('button', { name: /^₼+ · \d+$/ });
  await fireEvent.press(price[0]!);
  expect(
    screen.getByRole('button', {
      name: az.discovery.allSelected.replace('{{count}}', '1'),
    }),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: az.discovery.clear }),
  );
  expect(
    screen.getByRole('button', { name: az.discovery.all }),
  ).toBeOnTheScreen();
});

it('21: labels the restaurant response and reports it once with a stable key', async () => {
  mockReport
    .mockRejectedValueOnce(new Error('down'))
    .mockResolvedValue(undefined);
  await page(
    <OfficialReply
      feedbackId="fb"
      reply={{
        restaurantName: 'Nar',
        body: 'Thank you '.repeat(90),
        updatedAt: '2026-11-25T10:00:00.000Z',
      }}
    />,
  );
  expect(screen.getByText(new RegExp(az.replies.official))).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: az.replies.report }),
  );
  await fireEvent.changeText(
    screen.getByLabelText(az.replies.reason),
    ' rude ',
  );
  const send = () =>
    fireEvent.press(screen.getByRole('button', { name: az.replies.send }));
  await send();
  await waitFor(() =>
    expect(screen.getByText(az.replies.reportError)).toBeOnTheScreen(),
  );
  await send();
  await waitFor(() =>
    expect(screen.getByText(az.replies.reported)).toBeOnTheScreen(),
  );
  expect(mockReport.mock.calls[0]).toEqual(mockReport.mock.calls[1]);
  expect(mockReport.mock.calls[0]![1]).toBe('rude');
});
it('21: sends every staff and report write with an idempotency key', async () => {
  const calls: [string, string, string | undefined][] = [];
  setAccessToken('token');
  globalThis.fetch = jest.fn(async (url: unknown, init?: RequestInit) => {
    calls.push([
      init!.method!,
      String(url),
      (init!.headers as Record<string, string>)['Idempotency-Key'],
    ]);
    return init!.method === 'PUT'
      ? new Response(
          JSON.stringify({
            feedbackId: 'fb',
            dishName: 'Plov',
            rating: 4,
            comment: null,
            createdAt: '2026-11-25T10:00:00.000Z',
            reviewer: null,
            reply: null,
          }),
        )
      : new Response(null, { status: 204 });
  }) as typeof fetch;
  await httpStaffService.reply('fb', 'Thanks');
  await httpStaffService.deleteReply('fb');
  await httpFeedbackService.reportReply('fb', 'rude');
  expect(calls.map(([method, url]) => `${method} ${url}`)).toEqual([
    'PUT https://api.test/v1/staff/reviews/fb/reply',
    'DELETE https://api.test/v1/staff/reviews/fb/reply',
    'POST https://api.test/v1/feedback/fb/reply/report',
  ]);
  expect(calls.every(([, , key]) => Boolean(key))).toBe(true);
});
it('21: shows the staff entry only to restaurant staff', async () => {
  await page(<ProfileScreen />);
  await waitFor(() => expect(mockStaffPlaces).toHaveBeenCalled());
  expect(screen.queryByText(az.staff.title)).toBeNull();
  await screen.unmount();
  client.clear();
  mockStaffPlaces.mockResolvedValue({ items: [{ id: 'r1', name: 'Nar' }] });
  await page(<ProfileScreen />);
  await waitFor(() =>
    expect(screen.getByText(az.staff.title)).toBeOnTheScreen(),
  );
});
it('21: lets staff reply and delete after confirmation; hidden replies cannot be edited', async () => {
  const review: StaffReview = {
    feedbackId: 'fb',
    dishName: 'Plov',
    rating: 4,
    comment: 'Good',
    createdAt: '2026-11-25T10:00:00.000Z',
    reviewer: 'Aysel',
    reply: null,
  };
  mockStaffPlaces.mockResolvedValue({ items: [{ id: 'r1', name: 'Nar' }] });
  mockStaffReviews.mockResolvedValue({
    items: [
      review,
      {
        ...review,
        feedbackId: 'fb2',
        dishName: 'Dolma',
        reply: {
          body: 'Old answer',
          updatedAt: review.createdAt,
          status: 'hidden',
        },
      },
    ],
    nextCursor: null,
  });
  mockReply.mockResolvedValue(review);
  mockDeleteReply.mockResolvedValue(undefined);
  await page(<StaffReviewsScreen />);
  await waitFor(() =>
    expect(screen.getByText(az.staff.status.hidden)).toBeOnTheScreen(),
  );
  expect(
    screen.queryByRole('button', { name: `${az.staff.edit}: Dolma` }),
  ).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: `${az.staff.reply}: Plov` }),
  );
  await fireEvent.changeText(
    screen.getByLabelText(az.staff.yourReply),
    'Thank you',
  );
  await fireEvent.press(screen.getByRole('button', { name: az.staff.publish }));
  await waitFor(() =>
    expect(mockReply).toHaveBeenCalledWith('fb', 'Thank you', {
      idempotencyKey: expect.any(String),
    }),
  );
  await waitFor(() =>
    expect(screen.queryByLabelText(az.staff.yourReply)).toBeNull(),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: `${az.staff.delete}: Dolma` }),
  );
  expect(mockDeleteReply).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: az.staff.delete }));
  await waitFor(() => expect(mockDeleteReply).toHaveBeenCalledTimes(1));
});
