// Assemble the invoice evidence that answers a DRC-01 ITC demand.
//
// Pure function: no network, no filesystem, no database. The `import type` below
// is erased at compile time, so borrowing the store's row shape pulls in no
// runtime code and no seed file.
//
// D-09: an invoice has TWO dates. `doc_date` is when it was raised — that is
// what decides whether it falls inside the notice period. `deadline` is when it
// must be paid. Filtering on `deadline` would pull in invoices from the wrong
// tax period and hand the department a wrong answer.
//
// D-30: only `role === "evidence"` rows are candidates. Obligation rows (the
// notice itself, the receivable, the licence) are not purchase evidence, even
// when their dates happen to land inside the period.

import type { SeedEvidence, StoredRow } from "./db";
import type { EvidenceResult, EvidenceRow } from "./types";
import { normaliseDate } from "./normalise";

/**
 * Last-resort rate, used ONLY when a row carries no `evidence` block at all.
 * The expected path reads `taxable` and `gst` straight off the row: the seeded
 * Punjabi textile and hosiery invoices are at 5% and 12%, never 18%, so deriving
 * at a fixed rate is a fallback and never the source of truth.
 */
const FALLBACK_GST_RATE_PERCENT = 18;

interface NoticeTotals {
  claimed_itc: number | null;
  matched_itc: number | null;
  periodStart: string;
  periodEnd: string;
}

/**
 * Split a GST-inclusive invoice total into taxable value and tax.
 * `ObligationRow.amount` on an invoice is the gross: taxable + GST.
 */
function splitGross(gross: number, ratePercent: number): { taxable: number; gst: number } {
  const gst = Math.round((gross * ratePercent) / (100 + ratePercent));
  return { taxable: gross - gst, gst };
}

/** Prefer the stored figures; derive from the gross only when they are absent. */
function figuresFor(row: StoredRow): { taxable: number; gst: number } {
  const stored: SeedEvidence | undefined = row.evidence;
  if (stored && typeof stored.taxable === "number" && typeof stored.gst === "number") {
    return { taxable: stored.taxable, gst: stored.gst };
  }
  return splitGross(row.amount ?? 0, stored?.gst_rate ?? FALLBACK_GST_RATE_PERCENT);
}

function toEvidenceRow(row: StoredRow, docDate: string): EvidenceRow {
  const { taxable, gst } = figuresFor(row);
  const fallbackRef = row.obligation.trim() !== "" ? row.obligation : row.id;
  return {
    counterparty: row.counterparty,
    invoice_ref: row.evidence?.invoice_ref ?? fallbackRef,
    doc_date: docDate,
    taxable,
    gst,
  };
}

/**
 * Collect every purchase invoice raised inside the notice period and total the ITC.
 *
 * @param notice   period bounds (inclusive, ISO) plus the figures the notice states
 * @param invoices candidate rows; only `role === "evidence"` rows whose `doc_date`
 *                 falls inside the period survive
 */
export function assembleEvidence(notice: NoticeTotals, invoices: readonly StoredRow[]): EvidenceResult {
  const periodStart = normaliseDate(notice.periodStart) ?? notice.periodStart;
  const periodEnd = normaliseDate(notice.periodEnd) ?? notice.periodEnd;

  // ISO dates compare correctly as strings, so no Date objects are needed.
  const rows = invoices.flatMap((row) => {
    if (row.role !== "evidence") return [];
    const docDate = normaliseDate(row.doc_date);
    if (docDate === null || docDate < periodStart || docDate > periodEnd) return [];
    return [toEvidenceRow(row, docDate)];
  });

  // Prefer what the invoices actually prove; fall back to the notice's own
  // figure when we hold no invoices for the period.
  const rowsTotal = rows.reduce((sum, row) => sum + row.gst, 0);
  const claimedTotal = rows.length > 0 ? rowsTotal : notice.claimed_itc ?? 0;
  const matchedTotal = notice.matched_itc ?? 0;

  return {
    rows,
    claimedTotal,
    matchedTotal,
    gap: claimedTotal - matchedTotal,
    periodStart,
    periodEnd,
  };
}
