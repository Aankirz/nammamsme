import type { ReturnDetail, ReturnForm } from "@/lib/types";
import type { DocumentRow } from "@/components/lib/documents";
import { formatDate } from "@/components/lib/copy";
import { deadlineSortKey } from "@/components/lib/dates";
import { hasAmount } from "@/components/lib/money";
import { isReturn, reconciliationFor, toReturnDetail } from "@/components/lib/returns";

export type FormSlot = "sales" | "tax";

export interface HistoryEntry {
  row: DocumentRow;
  detail: ReturnDetail;
  startIso: string;
  endIso: string;
}

export interface HistoryPeriod {
  key: string;
  label: string;
  year: string;
  startIso: string;
  endIso: string;
  months: number;
  sales: HistoryEntry | null;
  tax: HistoryEntry | null;
  entries: readonly HistoryEntry[];
  settled: boolean;
  causal: HistoryEntry | null;
}

export interface HistoryTotals {
  taxPaid: number;
  taxPaidCount: number;
  lateFeesPaid: number;
  lateFeesRunning: number;
  lateFeesRunningCount: number;
  unmatched: number;
  unmatchedCount: number;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const MONTHS_IN_YEAR = 12;

const EMPTY_TOTALS: HistoryTotals = {
  taxPaid: 0,
  taxPaidCount: 0,
  lateFeesPaid: 0,
  lateFeesRunning: 0,
  lateFeesRunningCount: 0,
  unmatched: 0,
  unmatchedCount: 0,
};

function isoDate(value: unknown): string | null {
  return typeof value === "string" && ISO_DATE.test(value) ? value : null;
}

function monthIndex(iso: string): number {
  return Number(iso.slice(0, 4)) * MONTHS_IN_YEAR + Number(iso.slice(5, 7));
}

export function monthsSpanned(startIso: string, endIso: string): number {
  return monthIndex(endIso) - monthIndex(startIso) + 1;
}

export function slotFor(form: ReturnForm): FormSlot {
  return form === "GSTR-1" ? "sales" : "tax";
}

function monthAndYear(iso: string): string | null {
  const full = formatDate(iso);
  if (full === null) return null;

  return full.split(" ").slice(1).join(" ");
}

function derivedLabel(startIso: string, endIso: string): string {
  const from = monthAndYear(startIso);
  const to = monthAndYear(endIso);

  if (from === null || to === null) return "Period not established";

  return from === to ? from : `${from} to ${to}`;
}

function readEntry(row: DocumentRow): HistoryEntry | null {
  if (!isReturn(row)) return null;

  const detail = toReturnDetail(row.return);
  if (detail === null) return null;

  const startIso = isoDate(detail.period_start);
  const endIso = isoDate(detail.period_end);
  if (startIso === null || endIso === null || endIso < startIso) return null;

  return { row, detail, startIso, endIso };
}

function toPeriod(entries: readonly HistoryEntry[]): HistoryPeriod {
  const first = entries[0];
  const { startIso, endIso } = first;

  return {
    key: `${startIso}|${endIso}`,
    label: first.detail.period_label || derivedLabel(startIso, endIso),
    year: startIso.slice(0, 4),
    startIso,
    endIso,
    months: monthsSpanned(startIso, endIso),
    sales: entries.find((entry) => slotFor(entry.detail.form) === "sales") ?? null,
    tax: entries.find((entry) => slotFor(entry.detail.form) === "tax") ?? null,
    entries,
    settled: entries.every((entry) => entry.detail.state === "filed"),
    causal: entries.find((entry) => entry.detail.led_to !== null) ?? null,
  };
}

function newestFirst(a: HistoryPeriod, b: HistoryPeriod): number {
  if (a.startIso !== b.startIso) return b.startIso.localeCompare(a.startIso);

  return b.endIso.localeCompare(a.endIso);
}

export function buildHistory(rows: readonly DocumentRow[]): HistoryPeriod[] {
  const groups = new Map<string, HistoryEntry[]>();

  for (const row of rows) {
    const entry = readEntry(row);
    if (entry === null) continue;

    const key = `${entry.startIso}|${entry.endIso}`;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return [...groups.values()].map(toPeriod).sort(newestFirst);
}

export function unfiledPeriodCount(rows: readonly DocumentRow[]): number {
  return rows.filter((row) => isReturn(row) && readEntry(row) === null).length;
}

export function unmatchedOf(detail: ReturnDetail): number {
  const reconciliation = reconciliationFor(detail);
  if (reconciliation === null || reconciliation.unmatched <= 0) return 0;

  return reconciliation.unmatched;
}

function runningFee(detail: ReturnDetail): number {
  return hasAmount(detail.late_fee) && detail.late_fee > 0 ? detail.late_fee : 0;
}

function addEntry(totals: HistoryTotals, entry: HistoryEntry): HistoryTotals {
  const { detail } = entry;
  const filed = detail.state === "filed";
  const tax = filed && hasAmount(detail.tax_payable) ? detail.tax_payable : 0;
  const fee = runningFee(detail);
  const gap = unmatchedOf(detail);

  return {
    taxPaid: totals.taxPaid + tax,
    taxPaidCount: totals.taxPaidCount + (tax > 0 ? 1 : 0),
    lateFeesPaid: totals.lateFeesPaid + (filed ? fee : 0),
    lateFeesRunning: totals.lateFeesRunning + (filed ? 0 : fee),
    lateFeesRunningCount: totals.lateFeesRunningCount + (!filed && fee > 0 ? 1 : 0),
    unmatched: totals.unmatched + gap,
    unmatchedCount: totals.unmatchedCount + (gap > 0 ? 1 : 0),
  };
}

export function totalsFor(periods: readonly HistoryPeriod[]): HistoryTotals {
  return periods.flatMap((period) => period.entries).reduce(addEntry, EMPTY_TOTALS);
}

export function openReturns(periods: readonly HistoryPeriod[]): HistoryEntry[] {
  return periods
    .flatMap((period) => period.entries)
    .filter((entry) => entry.detail.state !== "filed")
    .sort((a, b) => {
      const keyA = deadlineSortKey(a.row.deadline);
      const keyB = deadlineSortKey(b.row.deadline);

      if (keyA === keyB) return 0;

      return keyA < keyB ? -1 : 1;
    });
}
