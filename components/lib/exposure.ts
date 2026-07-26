import type { DocumentRow } from "./documents";
import { shortName } from "./copy";
import { daysSince } from "./dates";
import { hasAmount } from "./money";
import {
  urgencyFor,
  HORIZON_DAYS,
  RECEIVABLE_OVERDUE_DAYS,
  type Tone,
} from "./urgency";

export interface ExposureLine {
  id: string;
  label: string;
  amount: number | null;
  count: string;
  tone: Tone;
}

export interface Collection {
  amount: number;
  days: number;
  counterparty: string;
  coversAll: boolean;
}

export interface Exposure {
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

function labelFor(row: DocumentRow): string {
  if (row.doc_type === "gst_notice") return "GST demand";
  if (row.doc_type === "licence") return `${shortName(row.counterparty)} licence`;
  if (row.doc_type === "gst_return") return `${row.return?.form ?? "GST"} return`;
  return shortName(row.counterparty);
}

function isAlreadyCounted(row: DocumentRow, rows: readonly DocumentRow[]): boolean {
  const detail = row.return;
  if (detail === null) return false;
  if (detail.state === "filed") return true;

  return detail.led_to !== null && rows.some((other) => other.id === detail.led_to);
}

function isMovingSoon(
  row: DocumentRow,
  rows: readonly DocumentRow[],
  now: Date,
): boolean {
  if (row.direction !== "owing") return false;
  if (isAlreadyCounted(row, rows)) return false;

  const { days } = urgencyFor(row, now);
  return days !== null && days <= HORIZON_DAYS;
}

function isOverdueReceivable(row: DocumentRow, now: Date): boolean {
  if (row.direction !== "owed") return false;

  const age = daysSince(row.doc_date ?? row.deadline, now);
  return age !== null && age > RECEIVABLE_OVERDUE_DAYS;
}

function toLine(row: DocumentRow, now: Date): ExposureLine {
  const urgency = urgencyFor(row, now);

  return {
    id: row.id,
    label: labelFor(row),
    amount: hasAmount(row.amount) ? row.amount : null,
    count: urgency.count,
    tone: urgency.tone,
  };
}

function pickCollection(
  rows: readonly DocumentRow[],
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

export interface Receivables {
  amount: number;
  count: number;
}

export interface UrgentItem {
  row: DocumentRow;
  days: number;
}

export function overdueReceivables(
  rows: readonly DocumentRow[],
  now: Date,
): Receivables {
  const overdue = rows.filter((row) => isOverdueReceivable(row, now));

  return {
    amount: overdue.reduce(
      (total, row) => (hasAmount(row.amount) ? total + row.amount : total),
      0,
    ),
    count: overdue.length,
  };
}

export function mostUrgent(
  rows: readonly DocumentRow[],
  now: Date,
): UrgentItem | null {
  let best: UrgentItem | null = null;

  for (const row of rows) {
    if (row.direction !== "owing") continue;
    if (isAlreadyCounted(row, rows)) continue;

    const { days } = urgencyFor(row, now);
    if (days === null) continue;
    if (best === null || days < best.days) best = { row, days };
  }

  return best;
}

export function computeExposure(rows: readonly DocumentRow[], now: Date): Exposure {
  if (rows.length === 0) return EMPTY_EXPOSURE;

  const moving = rows.filter((row) => isMovingSoon(row, rows, now));
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
