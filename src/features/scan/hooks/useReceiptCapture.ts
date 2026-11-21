import type { CameraView } from 'expo-camera';
import { useCallback, useRef, useState, type RefObject } from 'react';
import { services, type Receipt } from '@/services';
import type { OcrPage } from '@/services/contracts';
import { isApiError } from '@/services/http/errors';
import { MIN_RECEIPT_LINES, recognizeReceipt } from '../receiptOcr';

/** One photo of (part of) the receipt and what the phone could read from it. */
export type Frame = { base64: string; ocr: OcrPage | null };

export type CaptureStatus = 'processing' | 'needMore';
export type CaptureProblem = { key: string; fields: readonly string[] };

const MAX_FRAMES = 4;
const problemKeys: Record<string, string> = {
  RECEIPT_IMAGE_INCOMPLETE: 'incomplete',
  RECEIPT_IMAGE_MISMATCH: 'mismatch',
  RECEIPT_READER_UNAVAILABLE: 'unavailable',
  RECEIPT_READER_QUOTA: 'quota',
  NETWORK: 'network',
  TIMEOUT: 'network',
};

/** Photograph what the camera sees now. Null if the shot fails. */
export async function snapPhoto(
  camera: RefObject<CameraView | null>,
): Promise<{ uri: string; base64: string } | null> {
  try {
    const shot = await camera.current?.takePictureAsync({
      base64: true,
      quality: 0.6,
    });
    return shot?.base64 ? { uri: shot.uri, base64: shot.base64 } : null;
  } catch {
    return null;
  }
}

/** Read a photo on the device (OCR) and keep both for upload. */
export async function toFrame(shot: {
  uri: string;
  base64: string;
}): Promise<Frame> {
  return { base64: shot.base64, ocr: await recognizeReceipt(shot.uri) };
}

/** Photograph and read in one go (the shutter button). */
export async function takeFrame(
  camera: RefObject<CameraView | null>,
): Promise<Frame | null> {
  const shot = await snapPhoto(camera);
  return shot ? toFrame(shot) : null;
}

/**
 * One scan session: the fiscal QR plus photos of the printed receipt. The first photo
 * is taken automatically when the QR is detected; more parts can be added for long
 * receipts. The QR stays attached to the session, so photos can never be combined
 * with another receipt's QR.
 */
export function useReceiptCapture(onDone: (receipt: Receipt) => void) {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<CaptureStatus>('needMore');
  const [problem, setProblem] = useState<CaptureProblem | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const busy = useRef(false);

  const process = useCallback(
    async (sessionQr: string, all: Frame[]) => {
      if (busy.current || all.length === 0) return;
      // Cheap quality gate before any upload: the phone could barely read anything.
      if (
        all.every((f) => f.ocr !== null) &&
        all.every((f) => f.ocr!.lines.length < MIN_RECEIPT_LINES)
      ) {
        setProblem({ key: 'blurry', fields: [] });
        setStatus('needMore');
        return;
      }
      busy.current = true;
      setStatus('processing');
      setProblem(null);
      try {
        const ocr = all.every((f) => f.ocr !== null)
          ? all.map((f) => f.ocr!)
          : undefined;
        onDone(
          await services.receipt.importFiscalImage({
            qr: sessionQr,
            source: 'paper_photo',
            images: all.map((f) => ({ mime: 'image/jpeg', data: f.base64 })),
            ...(ocr ? { ocr } : {}),
          }),
        );
      } catch (cause) {
        setProblem({
          key: problemKeys[isApiError(cause) ? cause.code : ''] ?? 'unknown',
          fields: isApiError(cause) ? cause.fields : [],
        });
        setStatus('needMore');
      } finally {
        busy.current = false;
      }
    },
    [onDone],
  );

  /** QR found and no official source has the receipt: read the photo taken with it. */
  const start = useCallback(
    (sessionQr: string, first: Frame | null) => {
      setQr(sessionQr);
      setProblem(null);
      const initial = first ? [first] : [];
      setFrames(initial);
      if (first) void process(sessionQr, initial);
      else setStatus('needMore');
    },
    [process],
  );

  /** Another photo of the receipt (the full receipt, or the next part of a long one). */
  const add = useCallback((frame: Frame | null) => {
    if (!frame) {
      setProblem({ key: 'capture', fields: [] });
      return;
    }
    setProblem(null);
    setFrames((current) => [...current, frame].slice(-MAX_FRAMES));
  }, []);

  const read = useCallback(() => {
    if (qr) void process(qr, frames);
  }, [qr, frames, process]);

  const restart = useCallback(() => {
    setFrames([]);
    setProblem(null);
    setStatus('needMore');
  }, []);

  const end = useCallback(() => {
    setQr(null);
    setFrames([]);
    setProblem(null);
  }, []);

  return { qr, status, problem, frames, start, add, read, restart, end };
}
