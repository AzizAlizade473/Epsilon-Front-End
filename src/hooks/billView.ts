import { displayMerchantName, matchBrand } from '@/lib/brands';
import type { Receipt } from '@/services/contracts';

const titleCase = (text: string) =>
  text
    .toLocaleLowerCase('az')
    .replace(
      /(^|[\s-])(\p{L})/gu,
      (_, gap: string, letter: string) => gap + letter.toLocaleUpperCase('az'),
    );

/** Who the visit was to: the recognisable name on its own, the branch apart. */
export function billIdentity(receipt: Receipt) {
  const merchant =
    receipt.fiscal?.merchant.objectName ?? receipt.restaurant.name;
  const match =
    matchBrand(merchant) ?? matchBrand(receipt.restaurant.name) ?? null;
  const name = match ? match.brand.name : displayMerchantName(merchant);
  const printed = receipt.branch.name;
  // A branch printed as "KFC-VAĞZAL" is the district, not the brand again.
  const fromBrand = matchBrand(printed)?.branch ?? match?.branch ?? null;
  const branch = matchBrand(printed)
    ? fromBrand && titleCase(fromBrand)
    : printed !== name
      ? printed
      : fromBrand && titleCase(fromBrand);
  return {
    name,
    branch: branch || null,
    /** What the logo is looked up by. */
    logoName: match ? match.brand.name : receipt.restaurant.name,
  };
}

/** Dishes that can carry a rating, with what the customer gave each. */
export function billRatings(receipt: Receipt) {
  const rateable = receipt.items.filter(
    (item) =>
      item.rating !== null || (receipt.status === 'verified' && item.canRate),
  );
  const given = rateable.flatMap((item) =>
    item.rating === null ? [] : [item.rating],
  );
  return {
    total: rateable.length,
    done: given.length,
    average: given.length
      ? given.reduce((sum, stars) => sum + stars, 0) / given.length
      : null,
  };
}

export type BillCashback =
  | { kind: 'earned' | 'pending' | 'available'; amountMinor: number }
  | { kind: 'partner' | 'nonPartner' }
  | null;

/** Only what the server recorded or promised: nothing here is calculated. */
export function billCashback(receipt: Receipt): BillCashback {
  const recorded = receipt.cashback;
  if (recorded?.earnedMinor)
    return { kind: 'earned', amountMinor: recorded.earnedMinor };
  if (recorded?.pendingMinor)
    return { kind: 'pending', amountMinor: recorded.pendingMinor };
  const { done, total } = billRatings(receipt);
  if (receipt.status !== 'verified') return null;
  const fiscal = receipt.fiscal;
  if (fiscal && !fiscal.eligibility.ratingAllowed) return null;
  const canEarn = fiscal ? fiscal.eligibility.cashbackAllowed : true;
  if (canEarn && done < total)
    return receipt.rewardHint?.amountMinor
      ? { kind: 'available', amountMinor: receipt.rewardHint.amountMinor }
      : fiscal
        ? { kind: 'partner' }
        : null;
  if (fiscal && !fiscal.partner.isPartner && !canEarn)
    return { kind: 'nonPartner' };
  return null;
}

/** "2026-11": the month a visit is remembered under (device time). */
export const billMonth = (issuedAt: string) => {
  const date = new Date(issuedAt);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
