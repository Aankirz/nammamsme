/**
 * Rupee formatting. Indian digit grouping, no paise.
 *
 * The glyph, not "Rs": the designed screens use ₹ throughout (DESIGN.md,
 * "Currency"), and the figure must read the same everywhere it appears.
 */

const INDIAN_GROUPING = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const RUPEE_PREFIX = "₹";

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

/**
 * Seeded and model-written prose still writes amounts as "Rs 4,00,000". The
 * glyph is the product's currency everywhere it is read, so prose passes
 * through here on the way to the screen.
 */
const WRITTEN_RUPEES = /\bRs\.?\s?/g;

export function inRupees(text: string): string {
  return text.replace(WRITTEN_RUPEES, RUPEE_PREFIX);
}

export function hasAmount(amount: number | null | undefined): amount is number {
  return typeof amount === "number" && Number.isFinite(amount);
}
