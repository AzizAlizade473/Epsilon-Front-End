import { File, Paths } from 'expo-file-system';
import { services, type Receipt } from '@/services';
import type { CorrectedLine, OcrPage } from '@/services/contracts';
import { MIN_RECEIPT_LINES, recognizeReceipt } from '../receiptOcr';
import type { ReceiptExport } from './exportBridge';

/**
 * Reads the official receipt image on the phone (ML Kit, no quota) from a short-lived
 * file in the app's private cache, deleted straight after. Null when OCR is unavailable.
 */
async function readOnDevice(image: ReceiptExport): Promise<OcrPage | null> {
  let file: File | null = null;
  try {
    file = new File(
      Paths.cache,
      `ekassa-${Date.now()}.${image.mime === 'image/png' ? 'png' : 'jpg'}`,
    );
    file.create();
    file.write(image.data, { encoding: 'base64' });
    return await recognizeReceipt(file.uri);
  } catch {
    return null;
  } finally {
    try {
      if (file?.exists) file.delete();
    } catch {
      // Cache files are also cleared by the OS; never block the import on cleanup.
    }
  }
}

/**
 * Sends the official receipt image of the scanned QR to the backend. The server reads
 * the on-device text first and only falls back to its image reader when that is not
 * enough; it also checks that the image shows the same Fiscal ID as the QR.
 */
export async function importOfficialReceipt(
  qr: string,
  image: ReceiptExport,
  /** Product lines the customer completed after a partial read. */
  corrections?: CorrectedLine[],
): Promise<Receipt> {
  const ocr = await readOnDevice(image);
  const usable =
    ocr && ocr.lines.length >= MIN_RECEIPT_LINES ? [ocr] : undefined;
  return services.receipt.importFiscalImage({
    qr,
    source: 'official_page',
    images: [{ mime: image.mime, data: image.data }],
    ...(usable ? { ocr: usable } : {}),
    ...(corrections ? { corrections } : {}),
  });
}
