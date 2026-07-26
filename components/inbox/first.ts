import type { DocumentRow } from "@/components/lib/documents";
import { mostUrgent } from "@/components/lib/exposure";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { returnStatus } from "@/components/lib/returns";
import { RECEIVABLE_OVERDUE_DAYS, urgencyFor } from "@/components/lib/urgency";
import { feePerDay, returnName, returnSubtitle } from "./forms";
import { actionTitle, deadlineCount, kindMark } from "./rows";
import { daysInWords, rupeesInWords } from "./speech";

export interface FirstAction {
  row: DocumentRow;
  title: string;
  subtitle: string | null;
  count: string;
  late: boolean;
  amount: number | null;
  amountNote: string;
  because: string;
  cta: string;
  speech: string;
}

export interface ReturnMention {
  row: DocumentRow;
  label: string;
}

const COUNT_WORD = ["no", "one", "two", "three", "four", "five", "six"];

function inWords(count: number): string {
  return COUNT_WORD[count] ?? String(count);
}

function sentence(text: string): string {
  const trimmed = text.trim();
  const closed = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;

  return closed.charAt(0).toUpperCase() + closed.slice(1);
}

export function lateReturns(rows: readonly DocumentRow[], now: Date): DocumentRow[] {
  return rows
    .filter((row) => returnStatus(row, now).standing === "overdue")
    .sort((a, b) => (b.return?.days_late ?? 0) - (a.return?.days_late ?? 0));
}

function overdueReceivable(rows: readonly DocumentRow[], now: Date): DocumentRow | null {
  const owed = rows
    .filter((row) => row.direction === "owed" && hasAmount(row.amount))
    .filter((row) => {
      const { days } = urgencyFor(row, now);
      return days !== null && -days > RECEIVABLE_OVERDUE_DAYS;
    })
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

  return owed[0] ?? null;
}

/**
 * One answer to "what do I do today".
 *
 * A late return outranks everything else: it is already costing money by the
 * day and it holds up every filing behind it. After that, whatever falls due
 * soonest. Last, the oldest money somebody else is sitting on.
 */
function pickRow(rows: readonly DocumentRow[], now: Date): DocumentRow | null {
  const late = lateReturns(rows, now);
  if (late.length > 0) return late[0];

  const urgent = mostUrgent(rows, now);
  if (urgent) return urgent.row;

  return overdueReceivable(rows, now);
}

function totalLateFees(returns: readonly DocumentRow[]): number {
  return returns.reduce((total, row) => {
    const fee = row.return?.late_fee;
    return hasAmount(fee) ? total + fee : total;
  }, 0);
}

function blocksEwayBills(row: DocumentRow): boolean {
  return (row.return?.blocks ?? []).some((block) => /e-way/i.test(block));
}

function returnAction(row: DocumentRow, late: readonly DocumentRow[]): FirstAction {
  const behind = late.length - 1;
  const fees = totalLateFees(late);
  const perDay = feePerDay(row.return);
  const days = Math.round(row.return?.days_late ?? 0);

  const growth = perDay === null ? "and it grows every day" : `${formatRupees(perDay)} more every day`;
  const spread =
    late.length === 1
      ? "in late fees on this one"
      : `in late fees across ${inWords(late.length)} late returns`;

  const stuck =
    behind > 0
      ? `${inWords(behind)} later ${behind === 1 ? "return is" : "returns are"} stuck behind it`
      : "";
  const permits = blocksEwayBills(row) ? "you cannot make e-way bills for goods going out" : "";
  const joined = [stuck, permits].filter(Boolean).join(", and ");
  const because = joined === "" ? "The fee runs until the day it is filed." : sentence(joined);

  const name = returnName(row.return);

  return {
    row,
    title: `File your ${name}`,
    subtitle: returnSubtitle(row.return),
    count: `${days} days late`,
    late: true,
    amount: fees > 0 ? fees : null,
    amountNote: `${spread}, ${growth}`,
    because,
    cta: `Open the ${name}`,
    speech: [
      `File your ${name}.`,
      `It is ${daysInWords(days)}.`,
      fees > 0 ? `${rupeesInWords(fees)} ${spread}, ${growth}.` : "",
      because,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

const CONSEQUENCE: Record<string, string> = {
  gst_notice: "If the date passes with no reply, an order is passed without hearing you.",
  licence: "Once the date passes the registration stops being valid, and renewing late costs more.",
  owed: "The law lets you charge interest on this.",
  owing: "Pay it or the supplier can charge you interest on the delay.",
};

function plainAction(row: DocumentRow, now: Date): FirstAction {
  const urgency = urgencyFor(row, now);
  const owed = row.direction === "owed";
  const key =
    row.doc_type === "gst_notice" || row.doc_type === "licence"
      ? row.doc_type
      : owed
        ? "owed"
        : "owing";

  const title = actionTitle(row);
  const amount = hasAmount(row.amount) ? row.amount : null;
  const amountNote = owed ? "owed to you, still unpaid" : "you owe this";

  return {
    row,
    title,
    subtitle: `${kindMark(row)} · ${row.counterparty || "Not named"}`,
    count: deadlineCount(row, now),
    late: urgency.tone === "stamp",
    amount,
    amountNote: amount === null ? "no amount on the paper" : amountNote,
    because: CONSEQUENCE[key],
    cta: "Open this document",
    speech: [
      `${title}.`,
      `${deadlineCount(row, now)}.`,
      amount === null ? "" : `${rupeesInWords(amount)} ${amountNote}.`,
      CONSEQUENCE[key],
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export function firstAction(rows: readonly DocumentRow[], now: Date): FirstAction | null {
  const row = pickRow(rows, now);
  if (row === null) return null;

  const late = lateReturns(rows, now);
  if (late.length > 0 && late[0].id === row.id) return returnAction(row, late);

  return plainAction(row, now);
}

/** The late returns that are not the one being acted on, quietly named. */
export function otherLateReturns(
  rows: readonly DocumentRow[],
  now: Date,
  exceptId: string,
): ReturnMention[] {
  return lateReturns(rows, now)
    .filter((row) => row.id !== exceptId)
    .map((row) => ({
      row,
      label: `${returnName(row.return)}, ${Math.round(row.return?.days_late ?? 0)} days late`,
    }));
}

/** The next return that is not late yet, so the row can end on a calm fact. */
export function nextReturn(rows: readonly DocumentRow[], now: Date): ReturnMention | null {
  const due = rows
    .filter((row) => returnStatus(row, now).standing === "due")
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));

  const row = due[0];
  if (!row) return null;

  const { days } = urgencyFor(row, now);
  const name = returnName(row.return);

  return {
    row,
    label: days === null ? name : `${name}, ${days} days away`,
  };
}
