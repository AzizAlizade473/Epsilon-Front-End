import { z } from 'zod';
import {
  purchaseReferenceSchema,
  type PurchaseReference,
} from '@/services/contracts';

export type ScanState =
  | 'permission-unknown'
  | 'permission-denied'
  | 'scanning'
  | 'resolving'
  | 'success'
  | 'error'
  | 'manual-entry';
export type ScanEvent =
  | 'granted'
  | 'denied'
  | 'detect'
  | 'resolved'
  | 'failed'
  | 'retry'
  | 'manual'
  | 'close-manual';
/** No check is running or waiting to be dismissed. */
export const isIdle = (state: ScanState) =>
  state !== 'resolving' && state !== 'success' && state !== 'error';
export function scanTransition(state: ScanState, event: ScanEvent): ScanState {
  if (event === 'denied') return 'permission-denied';
  if (
    event === 'granted' &&
    (state === 'permission-unknown' || state === 'permission-denied')
  )
    return 'scanning';
  if (event === 'manual' && state !== 'resolving' && state !== 'success')
    return 'manual-entry';
  // An uploaded image needs no camera, so detection also starts without permission.
  if (event === 'detect' && isIdle(state)) return 'resolving';
  if (event === 'resolved' && state === 'resolving') return 'success';
  if (event === 'failed' && state === 'resolving') return 'error';
  if (
    (event === 'retry' && state === 'error') ||
    (event === 'close-manual' && state === 'manual-entry')
  )
    return 'scanning';
  return state;
}
/** Case is kept: printed Fiscal IDs are mixed-case. Up to the 44-character form. */
export const manualCodeSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, ''))
  .pipe(z.string().min(6).max(44));
/** A typed Fiscal ID (12 characters, or the 44-character form) as its official link. */
export function typedFiscalUrl(value: string): string | null {
  return /^[A-Za-z0-9]{12}(?:[A-Za-z0-9]{32})?$/.test(value)
    ? `https://monitoring.e-kassa.gov.az/#/index?doc=${value}`
    : null;
}
export function candidate(kind: PurchaseReference['kind'], value: string) {
  return purchaseReferenceSchema.safeParse({ kind, value });
}
