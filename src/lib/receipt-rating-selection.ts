import { registerAuthCleanup } from '@/lib/auth-lifecycle';

// The chosen inline star crosses the modal route in memory only, never in a URL.
let selection: { receiptItemId: string; rating: number } | undefined;
export function selectReceiptRating(receiptItemId: string, rating: number) {
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5)
    selection = { receiptItemId, rating };
  else selection = undefined;
}
export function selectedReceiptRating(receiptItemId: string) {
  return selection?.receiptItemId === receiptItemId ? selection.rating : 0;
}
export function clearReceiptRating(receiptItemId?: string) {
  if (!receiptItemId || selection?.receiptItemId === receiptItemId)
    selection = undefined;
}
registerAuthCleanup(() => {
  clearReceiptRating();
});
