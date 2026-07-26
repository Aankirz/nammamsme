/**
 * The rail headline, computed from the rows every time. Two filters over one
 * table (PRD, "Surfaces"). Never a stored aggregate.
 */

import type { ObligationRow } from "@/lib/types";
import { shortName } from "./copy";
import { daysSince } from "./dates";
import { hasAmount } from "./money";
import { urgencyFor, HORIZON_DAYS, RECEIVABLE_OVERDUE_DAYS, type Tone } from "./urgency";

export interface ExposureLine {
  id: string;
  /** "GST demand" / "Sharma Distributors" / "FSSAI licence" */
  label: string;
  /** Null for a licence, which has a date but no price. */
  amount: number | null;
  /** "19d left" */
  count: string;
  tone: Tone;
}

export interface Collection {
  amount: number;
  days: number;
  counterparty: string;
  /** Whether collecting it clears the whole 30-day exposure. */
  coversAll: boolean;
}

export interface Exposure {
  /** Rupees leaving the account inside the next 30 days, overdue included. */
  movingWithin30: number;
  documentCount: number;
  lines: ExposureLine[];
  collection: Collection | null;
}

const EMPTY_EXPOSURE: Exposure = {
  movingWithin30: 0,
  documentCount: 0,
  lines: [],
  collection: null,
};

function labelFor(row: ObligationRow): string {
  if (row.doc_type === "gst_notice") return "GST demand";
  if (row.doc_type === "licence") return `${shortName(row.counterparty)} licence`;
  return shortName(row.counterparty);
}

function isMovingSoon(row: ObligationRow, now: Date): boolean {
  if (row.direction !== "owing") return false;

  const { days } = urgencyFor(row, now);
  return days !== null && days <= HORIZON_DAYS;
}

function isOverdueReceivable(row: ObligationRow, now: Date): boolean {
  if (row.direction !== "owed") return false;

  const age = daysSince(row.doc_date ?? row.deadline, now);
  return age !== null && age > RECEIVABLE_OVERDUE_DAYS;
}

function toLine(row: ObligationRow, now: Date): ExposureLine {
  const urgency = urgencyFor(row, now);

  return {
    id: row.id,
    label: labelFor(row),
    amount: hasAmount(row.amount) ? row.amount : null,
    count: urgency.count,
    tone: urgency.tone,
  };
}

/**
 * The largest receivable sitting past the statutory 45 days. Named under the
 * exposure so the owner can see that money he is already owed would cover what
 * is about to leave (PRD user story 5).
 */
function pickCollection(
  rows: readonly ObligationRow[],
  now: Date,
  movingWithin30: number,
): Collection | null {
  const candidates = rows
    .filter((row) => isOverdueReceivable(row, now) && hasAmount(row.amount))
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

  const best = candidates[0];
  if (!best || !hasAmount(best.amount)) return null;

  return {
    amount: best.amount,
    days: daysSince(best.doc_date ?? best.deadline, now) ?? 0,
    counterparty: shortName(best.counterparty),
    coversAll: best.amount >= movingWithin30,
  };
}

export function computeExposure(rows: readonly ObligationRow[], now: Date): Exposure {
  if (rows.length === 0) return EMPTY_EXPOSURE;

  const moving = rows.filter((row) => isMovingSoon(row, now));
  const movingWithin30 = moving.reduce(
    (total, row) => (hasAmount(row.amount) ? total + row.amount : total),
    0,
  );

  return {
    movingWithin30,
    documentCount: moving.length,
    lines: moving
      .slice()
      .sort((a, b) => (urgencyFor(a, now).days ?? 0) - (urgencyFor(b, now).days ?? 0))
      .map((row) => toLine(row, now)),
    collection: pickCollection(rows, now, movingWithin30),
  };
}
