import type { ReturnForm } from "@/lib/types";
import type { FormSlot, HistoryPeriod } from "./history";

const ONE_MONTH = 1;
const ONE_QUARTER = 3;

export const SLOT_FORM: Record<FormSlot, ReturnForm> = {
  sales: "GSTR-1",
  tax: "GSTR-3B",
};

export function formTitle(form: ReturnForm, months: number): string {
  if (form === "GSTR-1") return "What you sold";
  if (form === "GSTR-9") return "The whole year together";
  if (months === ONE_MONTH) return "Monthly summary and tax";
  if (months === ONE_QUARTER) return "Quarterly summary and tax";

  return "Summary and tax";
}

export function periodStanding(period: HistoryPeriod): string {
  if (period.causal !== null) return "Filed, then questioned";
  if (!period.settled) return "Still open";

  return "Filed and clear";
}

export function returnCountPhrase(count: number): string {
  return count === 1 ? "1 return is still open" : `${count} returns are still open`;
}

export function sentenceCase(phrase: string): string {
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}
