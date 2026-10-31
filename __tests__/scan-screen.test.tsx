import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, Linking } from 'react-native';
import ScanScreen from '@/features/scan/screens/ScanScreen';
import { initializeI18n } from '@/lib/i18n';
import { createQueryClient } from '@/services/query';
import type { PurchaseReference, Receipt } from '@/services/contracts';
import type { MutationOptions } from '@/services/interfaces';
import { mockReceipt } from '@/services/mock/fixtures';
import { ApiError } from '@/services/http/errors';
import az from '../locales/az.json';

let mockPermission = { granted: false, status: 'undetermined' };
const mockRequest = jest.fn(async () => mockPermission);
const mockGet = jest.fn(async () => mockPermission);
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockToast = jest.fn();
const mockRouter = {
  replace: mockReplace,
  back: mockBack,
  canGoBack: () => true,
};
const mockResolve =
  jest.fn<
    (input: PurchaseReference, options?: MutationOptions) => Promise<Receipt>
  >();
let mockRead: ((event: { data: string }) => void) | undefined;
jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [mockPermission, mockRequest, mockGet],
  CameraView: ({ onBarcodeScanned }: { onBarcodeScanned: typeof mockRead }) => {
    mockRead = onBarcodeScanned;
    const { View } =
      jest.requireActual<typeof import('react-native')>('react-native');
    return <View testID="camera" />;
  },
}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => mockRouter,
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect]),
  };
});
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('@/services', () => ({
  services: {
    receipt: {
      resolve: (input: PurchaseReference, options?: MutationOptions) =>
        mockResolve(input, options),
    },
  },
}));
const client = createQueryClient();
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  mockPermission = { granted: false, status: 'undetermined' };
  mockResolve.mockReset().mockResolvedValue(mockReceipt);
  await initializeI18n();
});
afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});
async function scan() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>
        <ScanScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}
it('explains permission and requests it only after the user allows it', async () => {
  await scan();
  expect(mockRequest).not.toHaveBeenCalled();
  expect(screen.queryByTestId('camera')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: az.scan.allow }));
  expect(mockRequest).toHaveBeenCalledTimes(1);
});
it('offers Settings and manual entry after denial, normalizes the code, and shows recoverable server errors', async () => {
  mockPermission = { granted: false, status: 'denied' };
  mockResolve.mockRejectedValue(
    new ApiError({ code: 'RECEIPT_EXPIRED', message: 'Expired', status: 410 }),
  );
  const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  await scan();
  await fireEvent.press(screen.getByRole('button', { name: az.scan.settings }));
  expect(settings).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('button', { name: az.scan.manual }));
  await fireEvent.changeText(screen.getByLabelText(az.scan.code), ' ab 12-34 ');
  await fireEvent.press(
    screen.getByRole('button', { name: az.common.continue }),
  );
  await waitFor(() =>
    expect(mockResolve).toHaveBeenCalledWith(
      { kind: 'code', value: 'AB12-34' },
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    ),
  );
  await waitFor(() =>
    expect(screen.getByText(az.scan.errors.expired.title)).toBeOnTheScreen(),
  );
  expect(mockReplace).not.toHaveBeenCalled();
});
it('unmounts the camera on background and ignores a repeated frame during resolution', async () => {
  mockPermission = { granted: true, status: 'granted' };
  let foreground: ((state: 'background' | 'active') => void) | undefined;
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_name, handler) => {
      foreground = handler;
      return { remove: jest.fn() };
    });
  let finish: (value: Receipt) => void = () => undefined;
  mockResolve.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await scan();
  await waitFor(() => expect(screen.getByTestId('camera')).toBeOnTheScreen());
  await act(() => {
    mockRead?.({ data: 'opaque' });
    mockRead?.({ data: 'opaque' });
  });
  expect(mockResolve).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('camera')).toBeNull();
  await act(() => foreground?.('background'));
  await act(() => finish(mockReceipt));
  expect(mockReplace).not.toHaveBeenCalled();
  await act(() => foreground?.('active'));
  await waitFor(() => expect(screen.getByTestId('camera')).toBeOnTheScreen());
});
