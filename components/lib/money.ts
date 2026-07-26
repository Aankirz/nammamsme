/**
 * Rupee formatting. Indian digit grouping, no paise.
 *
 * "Rs" rather than the glyph, because that is how the amount is printed on the
 * documents themselves. A figure that reads differently in the app than on the
 * page it came from undercuts the point of showing the page.
 */

const INDIAN_GROUPING = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const RUPEE_PREFIX = "Rs ";

/**
 * Shown when an amount was never established. Written out rather than set as a
 * dash: a blank-looking figure in the largest slot on the screen reads as a
 * rendering fault, and this state is not a fault.
 */
export const NO_AMOUNT = "None stated";

export function formatRupees(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return NO_AMOUNT;
  }

  return `${RUPEE_PREFIX}${INDIAN_GROUPING.format(Math.round(amount))}`;
}

export function hasAmount(amount: number | null | undefined): amount is number {
  return typeof amount === "number" && Number.isFinite(amount);
}
