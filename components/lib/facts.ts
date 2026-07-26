/**
 * The three facts an owner needs before he can act, resolved to the place on
 * the page each one came from.
 *
 * Built on the server so the interactive layer carries state and markup only.
 */

import type { BlockKey } from "./source";
import type { DocumentRow } from "./documents";
import { daysUntil } from "./dates";
import { formatDate, noAmountPhrase } from "./copy";
import { formatRupees, hasAmount } from "./money";
import { findAmountBlock, findDateBlock, findPartyBlock, keyForRef } from "./trace";
import { urgencyFor, type Tone } from "./urgency";

export type FactVariant = "money" | "date" | "text";

export interface Fact {
  id: "amount" | "deadline" | "party";
  label: string;
  variant: FactVariant;
  /** Already formatted. The money variant renders `amount` instead. */
  value: string;
  amount: number | null;
  /** The line under the fact: what it means, or how long is left. */
  note: string | null;
  tone: Tone | null;
  /** Where on the page this came from, or null when it cannot be grounded. */
  blockKey: BlockKey | null;
  speech: string;
  speechLabel: string;
}

export function buildFacts(row: DocumentRow, now: Date): Fact[] {
  const source = row.source;
  const urgency = urgencyFor(row, now);
  const priced = hasAmount(row.amount);
  const deadlineDate = formatDate(row.deadline);
  const docDate = formatDate(row.doc_date);
  const isReceivable = row.direction === "owed";

  return [
    {
      id: "amount",
      label: "How much",
      variant: "money",
      value: priced ? formatRupees(row.amount) : noAmountPhrase(row.doc_type),
      amount: priced ? row.amount : null,
      note: priced ? (isReceivable ? "Owed to you" : "You owe this") : null,
      tone: null,
      blockKey: findAmountBlock(source, row.amount) ?? keyForRef(row.source_ref),
      speech: priced
        ? `${formatRupees(row.amount)}, ${isReceivable ? "owed to you" : "you owe this"}`
        : noAmountPhrase(row.doc_type),
      speechLabel: "Read the amount aloud",
    },
    {
      id: "deadline",
      label: "By when",
      variant: "date",
      value: deadlineDate ?? "No date found",
      amount: null,
      note: urgency.phrase,
      tone: urgency.tone,
      blockKey: findDateBlock(source, row.deadline),
      speech: deadlineDate
        ? `${deadlineDate}, ${urgency.phrase}`
        : "No date was found on this document",
      speechLabel: "Read the date aloud",
    },
    {
      id: "party",
      label: "Who sent it",
      variant: "text",
      value: row.counterparty || "Not named",
      amount: null,
      note: docDate ? `Dated ${docDate}` : null,
      tone: null,
      blockKey: findPartyBlock(source, row.counterparty),
      speech: `Sent by ${row.counterparty || "an unnamed party"}`,
      speechLabel: "Read the sender aloud",
    },
  ];
}

/** Days to the deadline, for callers that need the raw figure. */
export function deadlineDays(row: DocumentRow, now: Date): number | null {
  return daysUntil(row.deadline, now);
}
