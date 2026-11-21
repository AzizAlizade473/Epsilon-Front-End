import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import ScanScreen from '@/features/scan/screens/ScanScreen';
import { officialReceiptUrl } from '@/features/scan/components/ReceiptImageImport';
import { initializeI18n } from '@/lib/i18n';
import { createQueryClient } from '@/services/query';
import type {
  FiscalImport,
  PurchaseReference,
  Receipt,
} from '@/services/contracts';
import { mockReceipt } from '@/services/mock/fixtures';
import { ApiError } from '@/services/http/errors';
import az from '../locales/az.json';

const QR = 'https://monitoring.e-kassa.gov.az/#/index?doc=TESTFISC0001';
const mockReplace = jest.fn();
const mockResolve = jest.fn<(input: PurchaseReference) => Promise<Receipt>>();
const mockImport = jest.fn<(input: FiscalImport) => Promise<Receipt>>();
const mockLibrary = jest.fn<() => Promise<unknown>>();
const mockCamera = jest.fn<() => Promise<unknown>>();
const mockCameraPermission = jest.fn<() => Promise<{ granted: boolean }>>();
let mockRead: ((event: { data: string }) => void) | undefined;

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [
    { granted: true, status: 'granted' },
    jest.fn(),
    jest.fn(async () => ({ granted: true, status: 'granted' })),
  ],
  CameraView: ({ onBarcodeScanned }: { onBarcodeScanned: typeof mockRead }) => {
    mockRead = onBarcodeScanned;
    const { View } =
      jest.requireActual<typeof import('react-native')>('react-native');
    return <View testID="camera" />;
  },
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: () => mockLibrary(),
  launchCameraAsync: () => mockCamera(),
  requestCameraPermissionsAsync: () => mockCameraPermission(),
}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({
      replace: mockReplace,
      back: jest.fn(),
      canGoBack: () => true,
    }),
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect]),
  };
});
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => jest.fn() }));
jest.mock('@/services', () => ({
  services: {
    receipt: {
      resolve: (input: PurchaseReference) => mockResolve(input),
      importFiscalImage: (input: FiscalImport) => mockImport(input),
    },
  },
}));

const client = createQueryClient();
const unavailable = () =>
  new ApiError({
    code: 'RECEIPT_SOURCE_UNAVAILABLE',
    message: 'unavailable',
    status: 503,
  });
const asset = (mimeType = 'image/png') => ({
  uri: 'file://receipt.png',
  width: 1080,
  height: 2400,
  mimeType,
  base64: 'A'.repeat(200),
});

beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  mockResolve.mockReset().mockRejectedValue(unavailable());
  mockImport.mockReset().mockResolvedValue(mockReceipt);
  mockCameraPermission.mockResolvedValue({ granted: true });
  await initializeI18n();
});

async function scanFiscalQr(value = QR) {
  await render(
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
  await waitFor(() => expect(mockRead).toBeDefined());
  await act(async () => mockRead!({ data: value }));
  await waitFor(() =>
    expect(screen.getByText(az.scanImport.title)).toBeOnTheScreen(),
  );
}

it('offers the official page, image import and paper photo when no official source returns the receipt', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await scanFiscalQr(`${QR}\u0000`);
  expect(mockResolve).toHaveBeenCalledWith({
    kind: 'qr',
    value: `${QR}\u0000`,
  });
  await fireEvent.press(
    screen.getByRole('button', { name: az.scanImport.openOfficial }),
  );
  expect(open).toHaveBeenCalledWith(QR);
  expect(
    screen.getByRole('button', { name: az.scanImport.photograph }),
  ).toBeOnTheScreen();
  expect(screen.getByText(az.scanImport.trust)).toBeOnTheScreen();
});

it('imports the saved official receipt image and opens the real receipt', async () => {
  mockLibrary.mockResolvedValue({ canceled: false, assets: [asset()] });
  await scanFiscalQr();
  await fireEvent.press(
    screen.getByRole('button', { name: az.scanImport.importImage }),
  );
  await waitFor(() =>
    expect(mockImport).toHaveBeenCalledWith({
      qr: QR,
      source: 'official_page',
      images: [{ mime: 'image/png', data: 'A'.repeat(200) }],
    }),
  );
  expect(mockReplace).toHaveBeenCalledWith({
    pathname: '/receipt/[receiptId]',
    params: { receiptId: mockReceipt.id },
  });
});

it('photographs the paper receipt as a separate, labelled source', async () => {
  mockCamera.mockResolvedValue({
    canceled: false,
    assets: [asset('image/jpeg')],
  });
  await scanFiscalQr();
  await fireEvent.press(
    screen.getByRole('button', { name: az.scanImport.photograph }),
  );
  await waitFor(() =>
    expect(mockImport).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'paper_photo' }),
    ),
  );
});

it('says exactly which parts could not be read and keeps the options open', async () => {
  mockLibrary.mockResolvedValue({ canceled: false, assets: [asset()] });
  mockImport.mockRejectedValue(
    new ApiError({
      code: 'RECEIPT_IMAGE_INCOMPLETE',
      message: 'incomplete',
      status: 422,
      fields: ['line 2', 'total'],
    }),
  );
  await scanFiscalQr();
  await fireEvent.press(
    screen.getByRole('button', { name: az.scanImport.importImage }),
  );
  await waitFor(() =>
    expect(
      screen.getByText(az.scanImport.problem.incomplete),
    ).toBeOnTheScreen(),
  );
  expect(screen.getByText(/2-ci məhsul sətri, yekun məbləğ/)).toBeOnTheScreen();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: az.scanImport.importImage }),
  ).toBeOnTheScreen();
});

it('handles a denied camera and a cancelled picker without sending anything', async () => {
  mockCameraPermission.mockResolvedValue({ granted: false });
  mockLibrary.mockResolvedValue({ canceled: true, assets: null });
  await scanFiscalQr();
  await fireEvent.press(
    screen.getByRole('button', { name: az.scanImport.photograph }),
  );
  await waitFor(() =>
    expect(screen.getByText(az.scanImport.problem.camera)).toBeOnTheScreen(),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.scanImport.importImage }),
  );
  expect(mockImport).not.toHaveBeenCalled();
});

it('only ever opens the official e-kassa page', () => {
  expect(officialReceiptUrl(QR)).toBe(QR);
  expect(officialReceiptUrl('https://evil.example/#/index?doc=X')).toBeNull();
  expect(
    officialReceiptUrl('https://monitoring.e-kassa.gov.az.evil.example/'),
  ).toBeNull();
  expect(officialReceiptUrl(`${QR} javascript:alert(1)`)).toBeNull();
});
