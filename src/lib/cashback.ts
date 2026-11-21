/**
 * Working PILOT/DEMO cashback policy, in integer qəpik (1 ₼ = 100) so no
 * floating-point error can creep in.
 *
 * Production never uses this to credit money: the backend and the partner's
 * configured policy stay authoritative (SEC-5). This exists for demo data and
 * for explaining the pilot rule in the app.
 *
 * Order of operations: 1.5% of the eligible receipt total, rounded to the
 * nearest 0.05 ₼ (halves round up), then the 0.20 ₼ minimum (only for receipts
 * of at least 10 ₼), then the 0.60 ₼ cap. One reward per eligible verified
 * receipt, never per rated dish or product.
 */
export type CashbackPolicy = {
  /** Reward rate in permille: 15 = 1.5%. */
  ratePermille: number;
  /** Rounding step in qəpik: 5 = 0.05 ₼. */
  stepMinor: number;
  /** Minimum reward, applied only from `minFromMinor` upward. */
  minMinor: number;
  minFromMinor: number;
  capMinor: number;
};

export const DEMO_PILOT_POLICY: CashbackPolicy = {
  ratePermille: 15,
  stepMinor: 5,
  minMinor: 20,
  minFromMinor: 1000,
  capMinor: 60,
};

/** Pure policy maths on a receipt total. Invalid or non-positive input earns 0. */
export function computeCashbackMinor(
  receiptTotalMinor: number,
  policy: CashbackPolicy = DEMO_PILOT_POLICY,
): number {
  if (!Number.isSafeInteger(receiptTotalMinor) || receiptTotalMinor <= 0)
    return 0;
  const { ratePermille, stepMinor, minMinor, minFromMinor, capMinor } = policy;
  // round(total * rate / 1000 / step) * step, all in integers; x.5 rounds up.
  const rounded =
    Math.floor(
      (receiptTotalMinor * ratePermille * 2 + 1000 * stepMinor) /
        (2000 * stepMinor),
    ) * stepMinor;
  const floored =
    receiptTotalMinor >= minFromMinor ? Math.max(rounded, minMinor) : rounded;
  return Math.min(floored, capMinor);
}

/** Programmes that never pay cashback, whatever the receipt. */
const NO_CASHBACK_PROGRAMMES = new Set(['bhos']);

export type EligibleReceipt = {
  totalMinor: number;
  status: 'pending' | 'verified' | 'rejected' | string;
  /** Partner/programme id, for partner-specific rules. */
  partnerId?: string;
  /** Demo or concept data (for example the retail preview) never earns. */
  demo?: boolean;
};

/**
 * Reward for ONE receipt. Zero unless the receipt is verified, real (not demo)
 * and belongs to a programme that pays. A partner with its own configured policy
 * can be passed in `overrides`; that policy replaces the pilot defaults.
 */
export function receiptCashbackMinor(
  receipt: EligibleReceipt,
  overrides: Record<string, CashbackPolicy> = {},
): number {
  if (receipt.demo || receipt.status !== 'verified') return 0;
  const partner = receipt.partnerId?.toLowerCase();
  if (partner && NO_CASHBACK_PROGRAMMES.has(partner)) return 0;
  return computeCashbackMinor(
    receipt.totalMinor,
    (partner && overrides[partner]) || DEMO_PILOT_POLICY,
  );
}
