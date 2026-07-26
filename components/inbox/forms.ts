import type { ReturnDetail, ReturnForm } from "@/lib/types";

const PLAIN_NAME: Record<ReturnForm, string> = {
  "GSTR-1": "sales list",
  "GSTR-3B": "GST return",
  "GSTR-9": "yearly GST return",
};

const PLAIN_SCOPE: Record<ReturnForm, string> = {
  "GSTR-1": "the list of what you sold",
  "GSTR-3B": "sales, purchases and the tax you owe",
  "GSTR-9": "the whole year in one return",
};

const MONTH_AND_YEAR = /^([A-Z][a-z]+) \d{4}$/;

export function periodShort(label: string): string {
  const month = MONTH_AND_YEAR.exec(label);
  return month ? month[1] : label;
}

export function formName(form: ReturnForm): string {
  return PLAIN_NAME[form];
}

export function formScope(form: ReturnForm): string {
  return PLAIN_SCOPE[form];
}

/** "May GST return" / "June sales list". The form code never leads. */
export function returnName(detail: ReturnDetail | null): string {
  if (detail === null) return "GST return";

  const period = periodShort(detail.period_label);
  const name = formName(detail.form);

  return period === "" ? name : `${period} ${name}`;
}

/** The quiet second label: the code, then what it covers. */
export function returnSubtitle(detail: ReturnDetail | null): string | null {
  if (detail === null) return null;
  return `${detail.form} · ${formScope(detail.form)}`;
}

/** ₹50, derived from the fee the seed already carries. Null when it cannot be. */
export function feePerDay(detail: ReturnDetail | null): number | null {
  if (detail === null) return null;

  const fee = detail.late_fee;
  const days = Math.round(detail.days_late);

  if (typeof fee !== "number" || !Number.isFinite(fee) || fee <= 0) return null;
  if (days <= 0) return null;

  const perDay = fee / days;
  return Number.isInteger(perDay) ? perDay : null;
}
