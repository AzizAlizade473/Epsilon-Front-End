import { formatDateGroup } from './date';
export type WalletHistoryRow<T> =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'transaction'; key: string; transaction: T };
export function groupWalletHistory<T extends { id: string; createdAt: string }>(
  items: readonly T[],
  locale: string,
  referenceDate = new Date(),
) {
  const rows: WalletHistoryRow<T>[] = [];
  const stickyHeaderIndices: number[] = [];
  let previous = '';
  for (const transaction of [...items].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  )) {
    const date = new Date(transaction.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (key !== previous) {
      stickyHeaderIndices.push(rows.length);
      rows.push({
        kind: 'date',
        key: `date-${key}`,
        label: formatDateGroup(date, { locale, referenceDate }),
      });
      previous = key;
    }
    rows.push({ kind: 'transaction', key: transaction.id, transaction });
  }
  return { rows, stickyHeaderIndices };
}
