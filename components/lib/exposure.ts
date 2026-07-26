/**
 * The inbox headline, computed from the rows every time. Two filters over one
 * table (PRD "Surfaces") — never a stored aggregate.
 */

import type { ObligationRow } from "@/lib/types";
import { daysSince, daysUntil } from "./dates";
import {
  agePhrase,
  deadlinePhrase,
  expiryPhrase,
  shortName,
} from "./hindi";
import { hasAmount } from "./money";
import { HORIZON_DAYS, RECEIVABLE_OVERDUE_DAYS, type Tone } from "./urgency";

export interface ExposureHighlight {
  id: string;
  /** null for a licence, which has a date but no price. */
  amount: number | null;
  /** What it is, in Hindi. "जीएसटी" / "शर्मा डिस्ट्रीब्यूटर्स से आना है" */
  label: string;
  /** When it bites. "11 दिन बाकी" */
  timing: string;
  tone: Tone;
  /** Ordering key — smaller is more urgent. */
  rank: number;
}

export interface Exposure {
  /** Rupees due out inside the next 30 days, overdue included. */
  owingWithin30: number;
  owingWithin30Count: number;
  /** Rupees due in, sitting unpaid beyond 45 days. */
  owedOverdue: number;
  owedOverdueCount: number;
  highlights: ExposureHighlight[];
}

const MAX_PAYABLE_HIGHLIGHTS = 2;
const EMPTY_EXPOSURE: Exposure = {
  owingWithin30: 0,
  owingWithin30Count: 0,
  owedOverdue: 0,
  owedOverdueCount: 0,
  highlights: [],
};

function isPayableInHorizon(row: ObligationRow, now: Date): boolean {
  if (row.direction !== "owing") return false;

  const left = daysUntil(row.deadline, now);
  return left !== null && left <= HORIZON_DAYS;
}

function isOverdueReceivable(row: ObligationRow, now: Date): boolean {
  if (row.direction !== "owed") return false;

  const age = daysSince(row.doc_date ?? row.deadline, now);
  return age !== null && age > RECEIVABLE_OVERDUE_DAYS;
}

function sumAmounts(rows: readonly ObligationRow[]): number {
  return rows.reduce(
    (total, row) => (hasAmount(row.amount) ? total + row.amount : total),
    0,
  );
}

function byAmountDesc(a: ObligationRow, b: ObligationRow): number {
  return (b.amount ?? 0) - (a.amount ?? 0);
}

function payableHighlight(row: ObligationRow, now: Date): ExposureHighlight {
  const left = daysUntil(row.deadline, now);
  const label =
    row.doc_type === "gst_notice"
      ? "जीएसटी"
      : `${shortName(row.counterparty)} को देना है`;

  return {
    id: row.id,
    amount: row.amount,
    label,
    timing: deadlinePhrase(left),
    tone: left !== null && left <= 7 ? "danger" : "warn",
    rank: left ?? HORIZON_DAYS,
  };
}

function receivableHighlight(row: ObligationRow, now: Date): ExposureHighlight {
  const age = daysSince(row.doc_date ?? row.deadline, now) ?? 0;

  return {
    id: row.id,
    amount: row.amount,
    label: `${shortName(row.counterparty)} से आना है`,
    timing: agePhrase(age),
    tone: "danger",
    rank: HORIZON_DAYS + 1,
  };
}

function licenceHighlight(row: ObligationRow, now: Date): ExposureHighlight {
  const left = daysUntil(row.deadline, now);

  return {
    id: row.id,
    amount: null,
    label: `${shortName(row.counterparty)} लाइसेंस`,
    timing: expiryPhrase(left),
    tone: left !== null && left <= 7 ? "danger" : "warn",
    rank: left ?? HORIZON_DAYS,
  };
}

/**
 * Picks the few lines worth naming under the big number: the largest payables
 * falling due, the worst overdue receivable, and the nearest licence expiry.
 */
function pickHighlights(
  rows: readonly ObligationRow[],
  now: Date,
): ExposureHighlight[] {
  const payables = rows
    .filter(
      (row) =>
        row.doc_type !== "licence" &&
        isPayableInHorizon(row, now) &&
        hasAmount(row.amount),
    )
    .sort(byAmountDesc)
    .slice(0, MAX_PAYABLE_HIGHLIGHTS)
    .map((row) => payableHighlight(row, now));

  const receivable = rows
    .filter((row) => isOverdueReceivable(row, now) && hasAmount(row.amount))
    .sort(byAmountDesc)
    .slice(0, 1)
    .map((row) => receivableHighlight(row, now));

  const licence = rows
    .filter(
      (row) =>
        row.doc_type === "licence" &&
        (daysUntil(row.deadline, now) ?? Number.POSITIVE_INFINITY) <=
          HORIZON_DAYS * 3,
    )
    .sort(
      (a, b) =>
        (daysUntil(a.deadline, now) ?? 0) - (daysUntil(b.deadline, now) ?? 0),
    )
    .slice(0, 1)
    .map((row) => licenceHighlight(row, now));

  return [...payables, ...receivable, ...licence].sort(
    (a, b) => a.rank - b.rank,
  );
}

export function computeExposure(
  rows: readonly ObligationRow[],
  now: Date,
): Exposure {
  if (rows.length === 0) {
    return EMPTY_EXPOSURE;
  }

  const payables = rows.filter((row) => isPayableInHorizon(row, now));
  const receivables = rows.filter((row) => isOverdueReceivable(row, now));

  return {
    owingWithin30: sumAmounts(payables),
    owingWithin30Count: payables.length,
    owedOverdue: sumAmounts(receivables),
    owedOverdueCount: receivables.length,
    highlights: pickHighlights(rows, now),
  };
}
