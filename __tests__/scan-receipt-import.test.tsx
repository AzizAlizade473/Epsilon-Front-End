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
const mockRouter = {
  replace: mockReplace,
  back: jest.fn(),
  canGoBack: () => true,
};
const mockResolve = jest.fn<(input: PurchaseReference) => Promise<Receipt>>();
const mockImport = jest.fn<(input: FiscalImport) => Promise<Receipt>>();
const mockTake =
  jest.fn<() => Promise<{ uri: string; base64: string } | undefined>>();
const mockRecognize = jest.fn<(uri: string) => Promise<unknown>>();
const mockLibrary = jest.fn<() => Promise<unknown>>();
let mockRead: ((event: { data: string }) => void) | undefined;
const mockEvents: string[] = [];
const mockPermissions = [
  { granted: true, status: 'granted' },
  jest.fn(),
  jest.fn(async () => ({ granted: true, status: 'granted' })),
] as const;

jest.mock('expo-camera', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    useCameraPermissions: () => mockPermissions,
    CameraView: React.forwardRef(function MockCamera(
      { onBarcodeScanned }: { onBarcodeScanned: typeof mockRead },
      ref: React.Ref<unknown>,
    ) {
      mockRead = onBarcodeScanned;
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: () => mockTake(),
      }));
      return <View testID="camera" />;
    }),
  };
});
jest.mock('@infinitered/react-native-mlkit-text-recognition', () => ({
  recognizeText: (uri: string) => mockRecognize(uri),
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: () => mockLibrary(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => mockRouter,
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect]),
  };
});
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => jest.fn() }));
jest.mock('@/services', () => ({
  services: {
    receipt: {
      resolve: (input: PurchaseReference) => {
        mockEvents.push('resolve');
        return mockResolve(input);
      },
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
/** ML Kit-like result with `n` text lines. */
const ocrResult = (n: number) => ({
  text: '',
  blocks: [
    {
      text: '',
      frame: { left: 0, top: 0, right: 100, bottom: 100 },
      recognizedLanguages: [],
      lines: Array.from({ length: n }, (_, i) => ({
        text: `ROW ${i + 1}`,
        frame: { left: 10, top: i * 30, right: 300, bottom: i * 30 + 20 },
        recognizedLanguages: [],
        elements: [],
      })),
    },
  ],
});

beforeEach(async () => {
  jest.clearAllMocks();
  mockEvents.length = 0;
  client.clear();
  mockResolve.mockReset().mockRejectedValue(unavailable());
  mockImport.mockReset().mockResolvedValue(mockReceipt);
  mockTake.mockReset().mockImplementation(async () => {
    mockEvents.push('photo');
    return { uri: 'file://shot.jpg', base64: 'B'.repeat(200) };
  });
  mockRecognize.mockReset().mockResolvedValue(ocrResult(12));
  await initializeI18n();
});

async function scanQr(value = QR) {
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
}

it('one scan: photographs the receipt with the QR, reads it on the phone and opens the real receipt', async () => {
  await scanQr();
  await waitFor(() => expect(mockImport).toHaveBeenCalledTimes(1));
  expect(mockEvents.slice(0, 2)).toEqual(['photo', 'resolve']); // shot taken while the camera was live
  const sent = mockImport.mock.calls[0]![0];
  expect(sent).toMatchObject({ qr: QR, source: 'paper_photo' });
  expect(sent.images).toEqual([{ mime: 'image/jpeg', data: 'B'.repeat(200) }]);
  expect(sent.ocr?.[0]?.lines).toHaveLength(12);
  expect(sent.ocr?.[0]?.lines[0]).toEqual({
    text: 'ROW 1',
    box: [10, 0, 300, 20],
  });
  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/receipt/[receiptId]',
      params: { receiptId: mockReceipt.id },
    }),
  );
});

it('skips the photo upload when an official or partner source already has the receipt', async () => {
  mockResolve.mockResolvedValue(mockReceipt);
  await scanQr();
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  expect(mockImport).not.toHaveBeenCalled();
});

it('asks for the full receipt when the first photo is incomplete, then reads all photos together', async () => {
  mockImport.mockRejectedValueOnce(
    new ApiError({
      code: 'RECEIPT_IMAGE_INCOMPLETE',
      message: 'incomplete',
      status: 422,
      fields: ['items', 'total'],
    }),
  );
  await scanQr();
  await waitFor(() =>
    expect(
      screen.getByText(/bütün məhsul sətirləri, yekun məbləğ/),
    ).toBeOnTheScreen(),
  );
  expect(screen.getByText(az.scanImport.problem.incomplete)).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: az.capture.shutter }),
  );
  await waitFor(() =>
    expect(screen.getByText('Bu çekin 2 şəkli')).toBeOnTheScreen(),
  );
  await fireEvent.press(screen.getByRole('button', { name: az.capture.read }));
  await waitFor(() => expect(mockImport).toHaveBeenCalledTimes(2));
  expect(mockImport.mock.calls[1]![0].images).toHaveLength(2);
  expect(mockImport.mock.calls[1]![0].qr).toBe(QR); // same session, same QR
});

it('does not upload a photo the phone could barely read', async () => {
  mockRecognize.mockResolvedValue(ocrResult(2));
  await scanQr();
  await waitFor(() =>
    expect(screen.getByText(az.capture.problem.blurry)).toBeOnTheScreen(),
  );
  expect(mockImport).not.toHaveBeenCalled();
});

it('still uploads when on-device OCR is unavailable, letting the server decide', async () => {
  mockRecognize.mockRejectedValue(new Error('no ML Kit'));
  await scanQr();
  await waitFor(() => expect(mockImport).toHaveBeenCalledTimes(1));
  expect(mockImport.mock.calls[0]![0].ocr).toBeUndefined();
});

it('offers the official receipt image as an alternative', async () => {
  mockImport.mockRejectedValueOnce(
    new ApiError({
      code: 'RECEIPT_IMAGE_INCOMPLETE',
      message: 'incomplete',
      status: 422,
      fields: ['total'],
    }),
  );
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  mockLibrary.mockResolvedValue({
    canceled: false,
    assets: [{ mimeType: 'image/png', base64: 'C'.repeat(200) }],
  });
  await scanQr(`${QR}\u0000`);
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: az.capture.official }),
    ).toBeOnTheScreen(),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.capture.official }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: az.scanImport.openOfficial }),
  );
  expect(open).toHaveBeenCalledWith(QR);
  await fireEvent.press(
    screen.getByRole('button', { name: az.scanImport.importImage }),
  );
  await waitFor(() =>
    expect(mockImport).toHaveBeenLastCalledWith(
      expect.objectContaining({ source: 'official_page' }),
    ),
  );
});

it('only ever opens the official e-kassa page', () => {
  expect(officialReceiptUrl(QR)).toBe(QR);
  expect(officialReceiptUrl('https://evil.example/#/index?doc=X')).toBeNull();
  expect(
    officialReceiptUrl('https://monitoring.e-kassa.gov.az.evil.example/'),
  ).toBeNull();
});
