// Normalisation of Indian currency and date strings.
//
// A GST notice is read twice (Vision Extract + Vision Digitise). The two OCR
// passes disagree on punctuation constantly: "₹5,12,000/-" vs "5,12,000" vs
// "512000". Comparing those as strings would refuse a perfectly valid notice,
// which is the worst failure this app can produce. Everything numeric is
// funnelled through normaliseAmount before it is compared.

/** Only digits and decimal points survive the first pass. */
const NON_NUMERIC = /[^0-9.]/g;

/**
 * Coerce any Indian rupee representation to a plain integer number of rupees.
 *
 * "₹5,12,000/-" | "Rs. 5,12,000" | "5,12,000.00" | "512000" | 512000 -> 512000
 *
 * Paise are dropped, not rounded: a notice states whole rupees and the
 * fractional part is OCR noise more often than it is real.
 *
 * @returns the integer rupee value, or null when nothing parseable is present.
 */
export function normaliseAmount(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? Math.trunc(raw) : null;
  }

  // "Rs. 5,12,000" leaves a leading dot behind once letters are stripped, so
  // trim stray dots from both ends before splitting off the fractional part.
  const cleaned = raw.replace(NON_NUMERIC, "").replace(/^\.+/, "").replace(/\.+$/, "");
  if (cleaned === "") return null;

  const [integerPart] = cleaned.split(".");
  if (integerPart === "" || !/^\d+$/.test(integerPart)) return null;

  const value = Number.parseInt(integerPart, 10);
  return Number.isFinite(value) ? value : null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DAY_FIRST = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
const DAY_MONTH_NAME = /^(\d{1,2})[\s-]+([A-Za-z]+),?[\s-]+(\d{4})$/;
const MONTH_NAME_DAY = /^([A-Za-z]+)[\s-]+(\d{1,2})(?:st|nd|rd|th)?,?[\s-]+(\d{4})$/;

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > DAYS_IN_MONTH[month - 1]) return null;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function monthFromName(name: string): number | null {
  return MONTHS[name.slice(0, 3).toLowerCase()] ?? null;
}

/**
 * Coerce a date string to ISO `YYYY-MM-DD`.
 *
 * Indian convention is DAY first: "14/08/2026" is 14 August 2026, never
 * 8 December 2026. Ambiguous numeric dates are always read day-first.
 *
 * @returns ISO date string, or null when unparseable.
 */
export function normaliseDate(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const text = raw.trim();
  if (text === "") return null;

  const iso = ISO.exec(text);
  if (iso) return toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const dayFirst = DAY_FIRST.exec(text);
  if (dayFirst) return toIso(Number(dayFirst[3]), Number(dayFirst[2]), Number(dayFirst[1]));

  const dayMonth = DAY_MONTH_NAME.exec(text);
  if (dayMonth) {
    const month = monthFromName(dayMonth[2]);
    return month === null ? null : toIso(Number(dayMonth[3]), month, Number(dayMonth[1]));
  }

  const monthDay = MONTH_NAME_DAY.exec(text);
  if (monthDay) {
    const month = monthFromName(monthDay[1]);
    return month === null ? null : toIso(Number(monthDay[3]), month, Number(monthDay[2]));
  }

  return null;
}

/**
 * Every number-like token in a blob of OCR text, normalised.
 * Used to answer "does the digitise pass agree with this figure?".
 */
export function collectAmounts(text: string): Set<number> {
  const found = new Set<number>();
  for (const token of text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []) {
    const value = normaliseAmount(token);
    if (value !== null) found.add(value);
  }
  return found;
}
