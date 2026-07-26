/** Rupee formatting. Indian digit grouping, Latin digits, no paise. */

const INDIAN_GROUPING = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

/** Placeholder shown when an amount was never established. */
export const NO_AMOUNT = "—";

export function formatRupees(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return NO_AMOUNT;
  }

  return `₹${INDIAN_GROUPING.format(Math.round(amount))}`;
}

export function hasAmount(amount: number | null | undefined): amount is number {
  return typeof amount === "number" && Number.isFinite(amount);
}
