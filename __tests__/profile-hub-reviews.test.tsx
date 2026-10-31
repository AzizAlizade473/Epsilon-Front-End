import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import ReviewsScreen from '@/features/profile/screens/ReviewsScreen';
import { createQueryClient } from '@/services/query';
import { mockUser } from '@/services/mock/fixtures';
import { initializeI18n } from '@/lib/i18n';
import type { FeedbackReview, Paginated } from '@/services/contracts';
import az from '../locales/az.json';
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLogout = jest.fn(async () => undefined);
const mockToast = jest.fn();
const review: FeedbackReview = {
  feedbackId: 'fb',
  dishName: 'Server dish',
  restaurantName: 'Demo restaurant',
  rating: 2,
  comment: 'Server comment',
  createdAt: '2026-10-31T10:00:00Z',
};
const mockList = jest.fn<() => Promise<Paginated<FeedbackReview>>>();
jest.mock('@/services', () => ({
  services: {
    user: { me: async () => mockUser },
    feedback: { list: () => mockList() },
  },
}));
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));
jest.mock('@/providers/AuthProvider', () => ({
  useAuthActions: () => ({ logout: mockLogout }),
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: () => true,
  }),
}));
jest.mock('@shopify/flash-list', () => ({
  FlashList:
    jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
const client = createQueryClient();
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  mockList.mockReset().mockResolvedValue({ items: [review], nextCursor: null });
  await initializeI18n();
});
afterEach(() => client.clear());
async function page(child: React.ReactNode) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>{child}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}
it('uses the authenticated profile, masks its phone and routes the canonical account actions', async () => {
  await page(<ProfileScreen />);
  await waitFor(() =>
    expect(
      screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`),
    ).toBeOnTheScreen(),
  );
  expect(screen.queryByText(mockUser.phone!)).toBeNull();
  for (const [title, route] of [
    [az.profile.personal, 'personal-info'],
    [az.profile.reviews, 'my-reviews'],
    [az.profile.notifications, 'notifications'],
    [az.profile.language, 'language'],
    [az.profile.privacy, 'privacy'],
    [az.profile.help, 'help'],
  ]) {
    await fireEvent.press(
      screen.getByRole('button', { name: new RegExp(`^${title}`) }),
    );
    expect(mockPush).toHaveBeenLastCalledWith(`/profile/${route}`);
  }
});
it('requires confirmation before logout', async () => {
  await page(<ProfileScreen />);
  await fireEvent.press(
    screen.getByRole('button', { name: az.profile.logout }),
  );
  expect(mockLogout).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('button', { name: az.profile.logoutAction }),
  );
  expect(mockLogout).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/welcome');
});
it('renders actual server review content and keeps ratings read-only', async () => {
  await page(<ReviewsScreen />);
  await waitFor(() =>
    expect(screen.getByText('Server dish')).toBeOnTheScreen(),
  );
  expect(screen.getByText('Server comment')).toBeOnTheScreen();
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
});
