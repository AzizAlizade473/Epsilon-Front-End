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
export function scanTransition(state: ScanState, event: ScanEvent): ScanState {
  if (event === 'denied') return 'permission-denied';
  if (
    event === 'granted' &&
    (state === 'permission-unknown' || state === 'permission-denied')
  )
    return 'scanning';
  if (event === 'manual' && state !== 'resolving' && state !== 'success')
    return 'manual-entry';
  if (event === 'detect' && (state === 'scanning' || state === 'manual-entry'))
    return 'resolving';
  if (event === 'resolved' && state === 'resolving') return 'success';
  if (event === 'failed' && state === 'resolving') return 'error';
  if (
    (event === 'retry' && state === 'error') ||
    (event === 'close-manual' && state === 'manual-entry')
  )
    return 'scanning';
  return state;
}
export const manualCodeSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, '').toUpperCase())
  .pipe(z.string().min(6).max(32));
export function candidate(kind: PurchaseReference['kind'], value: string) {
  return purchaseReferenceSchema.safeParse({ kind, value });
}
