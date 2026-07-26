/**
 * Day arithmetic pinned to IST.
 *
 * The demo is judged in India but may be served from a UTC region. Doing this
 * in local server time produces an off-by-one on every deadline chip between
 * 18:30 and 00:00 UTC, which is exactly when a live demo happens.
 */

const MS_PER_DAY = 86_400_000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Milliseconds since epoch for an ISO date or datetime, or null if unusable. */
function parseIso(value: string | null | undefined): number | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  // A bare date means "this calendar day in India", not "midnight UTC".
  const normalised = DATE_ONLY.test(value) ? `${value}T00:00:00+05:30` : value;
  const parsed = Date.parse(normalised);

  return Number.isNaN(parsed) ? null : parsed;
}

/** Which IST calendar day a moment falls on, as an integer day number. */
function istDayIndex(ms: number): number {
  return Math.floor((ms + IST_OFFSET_MS) / MS_PER_DAY);
}

/** Whole IST days from today to `iso`. Negative means the date has passed. */
export function daysUntil(
  iso: string | null | undefined,
  now: Date,
): number | null {
  const target = parseIso(iso);
  if (target === null) {
    return null;
  }

  return istDayIndex(target) - istDayIndex(now.getTime());
}

/** Whole IST days since `iso`. Negative means the date is still in the future. */
export function daysSince(
  iso: string | null | undefined,
  now: Date,
): number | null {
  const until = daysUntil(iso, now);
  return until === null ? null : -until;
}

/** Sort key: earliest deadline first, undated rows last. */
export function deadlineSortKey(iso: string | null | undefined): number {
  return parseIso(iso) ?? Number.POSITIVE_INFINITY;
}
