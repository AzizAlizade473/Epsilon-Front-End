import type { OcrPage } from '@/services/contracts';

/**
 * On-device text recognition (Google ML Kit, no network, no quota). Returns the
 * recognised lines with their positions so the server can rebuild receipt rows.
 * Null when OCR is unavailable (web, Expo Go) or fails: the server then uses its
 * own fallback, and nothing is guessed here.
 */
export async function recognizeReceipt(uri: string): Promise<OcrPage | null> {
  try {
    const { recognizeText } =
      await import('@infinitered/react-native-mlkit-text-recognition');
    const result = await recognizeText(uri);
    const lines = result.blocks
      .flatMap((block) => block.lines)
      .filter((line) => line.text.trim().length > 0)
      .slice(0, 2000)
      .map((line) => ({
        text: line.text.slice(0, 500),
        box: [
          line.frame.left,
          line.frame.top,
          line.frame.right,
          line.frame.bottom,
        ] as [number, number, number, number],
      }));
    return { lines };
  } catch {
    return null;
  }
}

/** Fewer recognised lines than this means the photo is too blurry, dark or far away. */
export const MIN_RECEIPT_LINES = 6;
