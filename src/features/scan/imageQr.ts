import { scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export type ImageQr =
  | { data: string }
  | { error: 'IMAGE_NO_QR' | 'IMAGE_MULTIPLE_QR' | 'IMAGE_UNREADABLE' };

/**
 * Reads the QR code of one gallery image on the device; null when the customer
 * cancels. The system photo picker needs no storage permission.
 */
export async function pickQrFromImage(): Promise<ImageQr | null> {
  try {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
    });
    const uri = picked.canceled ? undefined : picked.assets[0]?.uri;
    if (!uri) return null;
    const found = await scanFromURLAsync(uri, ['qr']);
    const codes = [
      ...new Set(found.map((c) => c.data).filter((data) => data?.trim())),
    ];
    if (codes.length > 1) return { error: 'IMAGE_MULTIPLE_QR' };
    return codes[0] ? { data: codes[0] } : { error: 'IMAGE_NO_QR' };
  } catch {
    return { error: 'IMAGE_UNREADABLE' };
  }
}
