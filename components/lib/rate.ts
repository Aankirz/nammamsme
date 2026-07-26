import type { RateCheck, RateVerdict } from "@/lib/rates";

export interface InvoiceRate {
  invoiceRef: string;
  goods: string | null;
  check: RateCheck;
}

export type RateIndex = Record<string, InvoiceRate>;

export function percent(rate: number | null): string {
  return rate === null ? "not read" : `${rate}%`;
}

export function scheduleNote(check: RateCheck): string | null {
  if (check.verdict === "match") return null;
  if (check.verdict === "mismatch") return `schedule ${percent(check.expected[0])}`;
  if (check.verdict === "ambiguous") return "two lawful rates";
  return check.matchedCode === null && check.hsn !== "" ? "not in schedule" : "no code read";
}

export function spokenVerdict(verdict: RateVerdict): string {
  if (verdict === "match") return "matches the schedule";
  if (verdict === "mismatch") return "above the schedule rate";
  if (verdict === "ambiguous") return "more than one lawful rate, nothing asserted";
  return "not checked";
}

export function consequenceOf(rate: InvoiceRate, supplier: string): string {
  const { check } = rate;
  const who = supplier.trim() !== "" ? supplier : "This supplier";
  const expected = check.expected[0];

  return `${who}, invoice ${rate.invoiceRef}, is billed at ${percent(check.charged)}. The schedule puts HSN ${check.matchedCode ?? check.hsn} at ${percent(expected ?? null)}. Credit claimed above the lawful rate is credit the department will disallow.`;
}

export function restraintNote(count: number): string {
  const subject = count === 1 ? "One invoice carries" : `${count} invoices carry`;
  return `${subject} a code the schedule does not settle on its own. Nothing is being claimed about ${count === 1 ? "it" : "them"}.`;
}
