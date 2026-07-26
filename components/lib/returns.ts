import type { ReturnDetail, ReturnForm, ReturnState } from "@/lib/types";
import type { DocumentRow } from "./documents";
import { dayCountPhrase, deadlinePhrase, formatDate } from "./copy";
import { daysSince, daysUntil, deadlineSortKey } from "./dates";
import { hasAmount } from "./money";
import { toneForDaysLeft, type Tone } from "./urgency";

const FORMS: readonly string[] = ["GSTR-1", "GSTR-3B", "GSTR-9"];
const STATES: readonly string[] = ["filed", "due", "overdue"];

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function figure(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function toReturnDetail(value: unknown): ReturnDetail | null {
  if (typeof value !== "object" || value === null) return null;

  const candidate = value as Record<string, unknown>;
  const form = text(candidate.form);
  const state = text(candidate.state);

  if (form === null || !FORMS.includes(form)) return null;
  if (state === null || !STATES.includes(state)) return null;

  return {
    form: form as ReturnForm,
    period_label: text(candidate.period_label) ?? "",
    period_start: text(candidate.period_start) ?? "",
    period_end: text(candidate.period_end) ?? "",
    state: state as ReturnState,
    filed_on: text(candidate.filed_on),
    arn: text(candidate.arn),
    tax_payable: figure(candidate.tax_payable),
    itc_claimed: figure(candidate.itc_claimed),
    itc_available: figure(candidate.itc_available),
    late_fee: figure(candidate.late_fee),
    days_late: figure(candidate.days_late) ?? 0,
    blocks: Array.isArray(candidate.blocks)
      ? candidate.blocks.filter(
          (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
        )
      : [],
    led_to: text(candidate.led_to),
  };
}

export function isReturn(row: DocumentRow): boolean {
  return row.doc_type === "gst_return";
}

export type ReturnStanding = ReturnState | "unread";

export interface ReturnStatus {
  standing: ReturnStanding;
  ruleTone: Tone;
  countTone: Tone;
  count: string;
  phrase: string;
  daysLate: number | null;
}

const UNREAD: ReturnStatus = {
  standing: "unread",
  ruleTone: "unknown",
  countTone: "unknown",
  count: "not read",
  phrase: "Nothing has been read off this return yet",
  daysLate: null,
};

function lateDays(detail: ReturnDetail, row: DocumentRow, now: Date): number {
  const stated = Math.round(detail.days_late);
  if (stated > 0) return stated;

  const elapsed = daysSince(row.deadline ?? detail.period_end, now);
  return elapsed !== null && elapsed > 0 ? elapsed : 0;
}

export function returnStatus(row: DocumentRow, now: Date): ReturnStatus {
  const detail = row.return;
  if (detail === null) return UNREAD;

  if (detail.state === "filed") {
    const filedOn = formatDate(detail.filed_on);

    return {
      standing: "filed",
      ruleTone: "quiet",
      countTone: "settled",
      count: "filed",
      phrase: filedOn ? `Filed on ${filedOn}` : "Filed",
      daysLate: null,
    };
  }

  if (detail.state === "overdue") {
    const late = lateDays(detail, row, now);

    return {
      standing: "overdue",
      ruleTone: "stamp",
      countTone: "stamp",
      count: `${late}d late`,
      phrase: late === 1 ? "1 day late" : `${late} days late`,
      daysLate: late,
    };
  }

  const left = daysUntil(row.deadline, now);
  const tone = toneForDaysLeft(left);

  return {
    standing: "due",
    ruleTone: tone,
    countTone: tone,
    count: dayCountPhrase(left, false),
    phrase: deadlinePhrase(left),
    daysLate: null,
  };
}

const STANDING_ORDER: Record<ReturnStanding, number> = {
  overdue: 0,
  due: 1,
  unread: 2,
  filed: 3,
};

export interface RailGroups {
  obligations: DocumentRow[];
  returns: DocumentRow[];
}

export function groupRows(rows: readonly DocumentRow[], now: Date): RailGroups {
  const returns = rows.filter(isReturn).sort((a, b) => {
    const standingA = returnStatus(a, now).standing;
    const standingB = returnStatus(b, now).standing;
    const order = STANDING_ORDER[standingA] - STANDING_ORDER[standingB];

    if (order !== 0) return order;

    if (standingA === "overdue" || standingA === "due") {
      const keyA = deadlineSortKey(a.deadline);
      const keyB = deadlineSortKey(b.deadline);
      if (keyA !== keyB) return keyA < keyB ? -1 : 1;
    }

    return (b.return?.period_end ?? "").localeCompare(a.return?.period_end ?? "");
  });

  return {
    obligations: rows.filter((row) => !isReturn(row)),
    returns,
  };
}

export function lateReturnCount(rows: readonly DocumentRow[], now: Date): number {
  return rows.filter((row) => returnStatus(row, now).standing === "overdue").length;
}

export interface Reconciliation {
  claimed: number;
  reported: number;
  unmatched: number;
  noticeId: string | null;
}

export function reconciliationFor(detail: ReturnDetail | null): Reconciliation | null {
  if (detail === null) return null;
  if (!hasAmount(detail.itc_claimed) || !hasAmount(detail.itc_available)) return null;

  return {
    claimed: detail.itc_claimed,
    reported: detail.itc_available,
    unmatched: detail.itc_claimed - detail.itc_available,
    noticeId: detail.led_to,
  };
}

const MONTH_WORDS = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

interface CalendarPoint {
  months: number;
  day: number;
}

function calendarPoint(iso: string | null | undefined): CalendarPoint | null {
  if (typeof iso !== "string" || iso.length < 7) return null;

  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return { months: year * 12 + month, day: Number.isFinite(day) ? day : 1 };
}

export function monthsApartPhrase(
  fromIso: string | null | undefined,
  toIso: string | null | undefined,
): string | null {
  const from = calendarPoint(fromIso);
  const to = calendarPoint(toIso);

  if (from === null || to === null) return null;

  const whole = to.months - from.months;
  const months = to.day < from.day ? whole - 1 : whole;
  if (months < 1) return null;
  if (months === 1) return "a month";
  if (months <= 12) return `${MONTH_WORDS[months]} months`;

  return `${months} months`;
}

export type ReturnFactVariant = "money" | "date" | "reference";

export interface ReturnFact {
  id: string;
  label: string;
  variant: ReturnFactVariant;
  value: string;
  amount: number | null;
  note: string | null;
  tone: Tone | null;
}

function moneyFact(detail: ReturnDetail, filed: boolean): ReturnFact {
  const priced = hasAmount(detail.tax_payable);

  return {
    id: "tax",
    label: filed ? "Tax paid" : "Tax payable",
    variant: "money",
    value: priced ? "" : "Nothing to pay",
    amount: priced ? detail.tax_payable : null,
    note: priced
      ? filed
        ? `Paid for ${detail.period_label || "this period"}`
        : "Still to be paid"
      : "This return carries no tax for the period",
    tone: null,
  };
}

function lateFeeFact(detail: ReturnDetail): ReturnFact | null {
  if (detail.state !== "overdue") return null;
  if (!hasAmount(detail.late_fee) || detail.late_fee <= 0) return null;

  return {
    id: "late-fee",
    label: "Late fee so far",
    variant: "money",
    value: "",
    amount: detail.late_fee,
    note: "It grows every day this stays unfiled",
    tone: "stamp",
  };
}

export function buildReturnFacts(
  row: DocumentRow,
  detail: ReturnDetail,
  now: Date,
): ReturnFact[] {
  const filed = detail.state === "filed";
  const status = returnStatus(row, now);
  const facts: ReturnFact[] = [moneyFact(detail, filed)];

  const lateFee = lateFeeFact(detail);
  if (lateFee) facts.push(lateFee);

  facts.push({
    id: "when",
    label: filed ? "Filed on" : "Due by",
    variant: "date",
    value:
      (filed ? formatDate(detail.filed_on) : formatDate(row.deadline)) ?? "No date found",
    amount: null,
    note: filed ? "On the portal, nothing outstanding" : status.phrase,
    tone: filed ? "settled" : status.countTone,
  });

  if (detail.arn) {
    facts.push({
      id: "arn",
      label: "Acknowledgement number",
      variant: "reference",
      value: detail.arn,
      amount: null,
      note: "Keep this for your CA",
      tone: null,
    });
  }

  return facts;
}
