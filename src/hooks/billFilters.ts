import type { ReceiptListParams } from '@/services/contracts';

export type BillFilters = {
  date: 'any' | 'week' | 'month' | 'custom';
  /** YYYY-MM-DD, used by the custom range. */
  from: string;
  to: string;
  partner: 'any' | 'yes' | 'no';
  cashback: 'any' | 'eligible' | 'none';
};
export const noBillFilters: BillFilters = {
  date: 'any',
  from: '',
  to: '',
  partner: 'any',
  cashback: 'any',
};
const DAY = 86_400_000;
/** Calendar day in Asia/Baku (UTC+4 all year), `daysAgo` days back. */
export function bakuDay(now: number, daysAgo = 0) {
  return new Date(now + 4 * 3_600_000 - daysAgo * DAY)
    .toISOString()
    .slice(0, 10);
}
export function activeFilterCount(filters: BillFilters) {
  return [filters.date, filters.partner, filters.cashback].filter(
    (value) => value !== 'any',
  ).length;
}
/** Query for GET /receipts: only what narrows the history is sent. */
export function billParams(
  search: string,
  filters: BillFilters,
  now: number,
): ReceiptListParams {
  const params: ReceiptListParams = {};
  const q = search.trim().slice(0, 80);
  if (q) params.q = q;
  if (filters.date === 'week') params.from = bakuDay(now, 6);
  if (filters.date === 'month') params.from = bakuDay(now, 29);
  if (filters.date === 'custom') {
    let { from, to } = filters;
    // A reversed range means the same two days.
    if (from && to && from > to) [from, to] = [to, from];
    if (from) params.from = from;
    if (to) params.to = to;
  }
  if (filters.partner !== 'any') params.partner = filters.partner === 'yes';
  if (filters.cashback !== 'any') params.cashback = filters.cashback;
  return params;
}
