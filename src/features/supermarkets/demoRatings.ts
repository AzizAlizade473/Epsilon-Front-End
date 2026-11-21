import { useSyncExternalStore } from 'react';

/**
 * Try-it-yourself product ratings for the retail demo. In memory only: never
 * sent to the feedback API or outbox, never merged into product statistics,
 * never touching the wallet or activity. Cleared when the app restarts.
 */
export type DemoRating = {
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

let ratings: Record<string, DemoRating> = {};
const listeners = new Set<() => void>();

export function saveDemoRating(entry: DemoRating) {
  if (!Number.isInteger(entry.rating) || entry.rating < 1 || entry.rating > 5)
    throw new Error('Rating must be 1-5');
  ratings = {
    ...ratings,
    [entry.productId]: {
      ...entry,
      comment: entry.comment.trim().slice(0, 500),
    },
  };
  listeners.forEach((l) => l());
}

export function clearDemoRatings() {
  ratings = {};
  listeners.forEach((l) => l());
}

export function useDemoRating(productId: string): DemoRating | undefined {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => ratings[productId],
  );
}
