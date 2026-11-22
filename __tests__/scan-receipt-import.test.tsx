import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ScanScreen from '@/features/scan/screens/ScanScreen';
import { OfficialReceiptScreen } from '@/features/scan/screens/OfficialReceiptScreen';
import {
  EXPORT_BRIDGE_SCRIPT,
  isAllowedTopNavigation,
  officialReceiptUrl,
  parseExportMessage,
} from '@/features/scan/ekassa/exportBridge';
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
const LONG_QR = `https://monitoring.e-kassa.gov.az/#/index?doc=TESTFISC0001${'a1B2c3D4'.repeat(4)}`;
/** A small but valid-looking JPEG (signature + padding), as base64. */
const JPEG = `/9j/${'A'.repeat(2000)}`;
const exportMessage = (data = JPEG) =>
  JSON.stringify({ type: 'epsilon:ekassa-export', size: 1500, data });

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = {
  replace: mockReplace,
  push: mockPush,
  back: jest.fn(),
  canGoBack: () => true,
};
let mockParams: { qr?: string } = {};
const mockResolve = jest.fn<(input: PurchaseReference) => Promise<Receipt>>();
const mockImport = jest.fn<(input: FiscalImport) => Promise<Receipt>>();
const mockRecognize = jest.fn<(uri: string) => Promise<unknown>>();
const mockReload = jest.fn();
const mockDeleted: string[] = [];
let mockRead: ((event: { data: string }) => void) | undefined;
let mockPage:
  | {
      onMessage: (event: { nativeEvent: { data: string } }) => void;
      onShouldStartLoadWithRequest: (r: {
        url: string;
        isTopFrame?: boolean;
      }) => boolean;
      injectedJavaScriptBeforeContentLoaded: string;
      source: { uri: string };
    }
  | undefined;
const mockPermissions = [
  { granted: true, status: 'granted' },
  jest.fn(),
  jest.fn(async () => ({ granted: true, status: 'granted' })),
] as const;

jest.mock('expo-camera', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    useCameraPermissions: () => mockPermissions,
    CameraView: function MockCamera({
      onBarcodeScanned,
    }: {
      onBarcodeScanned: typeof mockRead;
    }) {
      mockRead = onBarcodeScanned;
      return <View testID="camera" />;
    },
  };
});
jest.mock('react-native-webview', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    WebView: React.forwardRef(function MockWebView(
      props: NonNullable<typeof mockPage>,
      ref: React.Ref<unknown>,
    ) {
      mockPage = props;
      React.useImperativeHandle(ref, () => ({ reload: mockReload }));
      return <View testID="official-page" />;
    }),
  };
});
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    uri: string;
    exists = false;
    constructor(dir: string, name: string) {
      this.uri = `${dir}/${name}`;
    }
    create() {
      this.exists = true;
    }
    write() {}
    delete() {
      mockDeleted.push(this.uri);
      this.exists = false;
    }
  },
}));
jest.mock('@infinitered/react-native-mlkit-text-recognition', () => ({
  recognizeText: (uri: string) => mockRecognize(uri),
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockParams,
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
  client.clear();
  mockPage = undefined;
  mockDeleted.length = 0;
  mockParams = { qr: QR };
  mockResolve.mockReset().mockRejectedValue(
    new ApiError({
      code: 'RECEIPT_SOURCE_UNAVAILABLE',
      message: 'unavailable',
      status: 503,
    }),
  );
  mockImport.mockReset().mockResolvedValue(mockReceipt);
  mockRecognize.mockReset().mockResolvedValue(ocrResult(12));
  await initializeI18n();
});

const wrap = (children: React.ReactNode) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 360, height: 640 },
      insets: { top: 24, bottom: 24, left: 0, right: 0 },
    }}
  >
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);

describe('scanning a fiscal QR', () => {
  async function scanQr(value: string) {
    await render(wrap(<ScanScreen />));
    await waitFor(() => expect(mockRead).toBeDefined());
    await act(async () => mockRead!({ data: value }));
  }

  it('opens the official e-kassa receipt with the full document identifier, no photo', async () => {
    await scanQr(`${LONG_QR}\u0000`);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/receipt-import',
        params: { qr: LONG_QR },
      }),
    );
    expect(mockImport).not.toHaveBeenCalled();
  });

  it('opens the receipt directly when a partner POS already sent it', async () => {
    mockResolve.mockResolvedValue(mockReceipt);
    await scanQr(QR);
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('official receipt page', () => {
  const showPage = async () => {
    await render(wrap(<OfficialReceiptScreen />));
    await waitFor(() => expect(mockPage).toBeDefined());
  };
  const download = (data?: string) =>
    act(async () =>
      mockPage!.onMessage({ nativeEvent: { data: exportMessage(data) } }),
    );

  it('loads the official page with the export bridge installed before page scripts', async () => {
    await showPage();
    expect(mockPage!.source.uri).toBe(QR);
    expect(mockPage!.injectedJavaScriptBeforeContentLoaded).toBe(
      EXPORT_BRIDGE_SCRIPT,
    );
  });

  it('imports the exported JPG and opens the native receipt screen', async () => {
    await showPage();
    expect(mockImport).not.toHaveBeenCalled(); // nothing happens before the download
    await download();
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/receipt/[receiptId]',
        params: { receiptId: mockReceipt.id },
      }),
    );
    const sent = mockImport.mock.calls[0]![0];
    expect(sent).toMatchObject({ qr: QR, source: 'official_page' });
    expect(sent.images).toEqual([{ mime: 'image/jpeg', data: JPEG }]);
    expect(sent.ocr?.[0]?.lines).toHaveLength(12);
    expect(mockDeleted).toHaveLength(1); // temporary file removed
  });

  it('imports once even when the download is tapped twice', async () => {
    let finish: (r: Receipt) => void = () => undefined;
    mockImport.mockImplementation(
      () => new Promise<Receipt>((resolve) => (finish = resolve)),
    );
    await showPage();
    await download();
    await download();
    await act(async () => finish(mockReceipt));
    expect(mockImport).toHaveBeenCalledTimes(1);
  });

  it('never imports a file that is not an image', async () => {
    await showPage();
    await download(`JVBER${'A'.repeat(2000)}`); // a PDF signature
    expect(mockImport).not.toHaveBeenCalled();
    expect(screen.getByText(az.scanImport.problem.format)).toBeOnTheScreen();
  });

  it('explains an unreadable receipt and lets the customer retry the page', async () => {
    mockImport.mockRejectedValue(
      new ApiError({
        code: 'RECEIPT_IMAGE_INCOMPLETE',
        message: 'incomplete',
        status: 422,
        fields: ['total'],
      }),
    );
    await showPage();
    await download();
    await waitFor(() =>
      expect(
        screen.getByText(az.scanImport.problem.incomplete),
      ).toBeOnTheScreen(),
    );
    expect(mockReplace).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: az.scan.retry }));
    expect(mockReload).toHaveBeenCalled();
  });

  it('refuses to open anything that is not an official receipt QR', async () => {
    mockParams = { qr: 'https://evil.example/#/index?doc=TESTFISC0001' };
    await render(wrap(<OfficialReceiptScreen />));
    expect(mockPage).toBeUndefined();
    expect(
      screen.getByText(az.scan.errors.unsupported.title),
    ).toBeOnTheScreen();
  });
});

describe('e-kassa export bridge', () => {
  it.each([
    [QR, QR],
    [`${LONG_QR}\u0000`, LONG_QR],
    ['https://evil.example/#/index?doc=TESTFISC0001', null],
    [
      'https://monitoring.e-kassa.gov.az.evil.example/#/index?doc=TESTFISC0001',
      null,
    ],
    ['http://monitoring.e-kassa.gov.az/#/index?doc=TESTFISC0001', null],
    ['https://monitoring.e-kassa.gov.az/#/index?doc=SHORT', null],
  ])('official URL for %s', (qr, url) =>
    expect(officialReceiptUrl(qr)).toBe(url),
  );

  it('keeps top-level navigation on the official site', () => {
    expect(isAllowedTopNavigation(QR)).toBe(true);
    expect(isAllowedTopNavigation('https://evil.example/')).toBe(false);
    expect(isAllowedTopNavigation('intent://x')).toBe(false);
  });

  it('accepts only real image exports of a sensible size', () => {
    expect(parseExportMessage(exportMessage())).toMatchObject({
      mime: 'image/jpeg',
      data: JPEG,
    });
    expect(
      parseExportMessage(exportMessage(`iVBORw0KGgo${'A'.repeat(2000)}`)),
    ).toMatchObject({ mime: 'image/png' });
    expect(parseExportMessage(exportMessage('/9j/AAAA'))).toEqual({
      problem: 'size',
    });
    expect(parseExportMessage(exportMessage('not base64!'))).toEqual({
      problem: 'format',
    });
    expect(parseExportMessage('{"type":"other"}')).toBeNull();
    expect(parseExportMessage('not json')).toBeNull();
  });
});
