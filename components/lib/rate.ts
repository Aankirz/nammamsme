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

const READABLE_CODE = /\d{4}/;

export function codeOf(check: RateCheck): string {
  return check.matchedCode ?? (READABLE_CODE.test(check.hsn) ? check.hsn : "none");
}

export function scheduleNote(check: RateCheck): string | null {
  if (check.verdict === "match") return null;
  if (check.verdict === "mismatch") {
    return `schedule ${percent(check.expected[0] ?? null)}`;
  }
  if (check.verdict === "ambiguous") return "two lawful rates";
  if (!READABLE_CODE.test(check.hsn)) return "no code read";
  if (check.matchedCode === null) return "not in the schedule";
  return "no rate read";
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
  const expected = check.expected[0] ?? null;
  const over = check.charged !== null && expected !== null && check.charged > expected;

  const consequence = over
    ? "Credit claimed above the lawful rate is credit the department will disallow."
    : "Tax billed below the lawful rate is tax the department will come back for, with interest.";

  return `${who}, invoice ${rate.invoiceRef}, is billed at ${percent(check.charged)}. The schedule puts HSN ${codeOf(check)} at ${percent(expected)}. ${consequence}`;
}

export function restraintNote(count: number): string {
  const subject = count === 1 ? "One invoice carries" : `${count} invoices carry`;
  return `${subject} a code the schedule does not settle on its own. Nothing is being claimed about ${count === 1 ? "it" : "them"}.`;
}
