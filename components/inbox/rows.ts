import type { DocumentRow } from "@/components/lib/documents";
import { shortName } from "@/components/lib/copy";
import { urgencyFor } from "@/components/lib/urgency";
import { returnName } from "./forms";

/** Regulators, in the words the owner uses for the paper they issue. */
const LICENCE_WORD: readonly [RegExp, string][] = [[/food safety|fssai/i, "food licence"]];

export function kindMark(row: DocumentRow): string {
  if (row.doc_type === "gst_notice") return "Tax notice";
  if (row.doc_type === "licence") return "Licence";
  if (row.doc_type === "gst_return") return "GST return";

  return row.direction === "owed" ? "Sale" : "Bill";
}

function licenceWord(counterparty: string): string {
  return LICENCE_WORD.find(([pattern]) => pattern.test(counterparty))?.[1] ?? "licence";
}

export function actionTitle(row: DocumentRow): string {
  if (row.doc_type === "gst_notice") return "Answer the tax demand";
  if (row.doc_type === "gst_return") return `File your ${returnName(row.return)}`;
  if (row.doc_type === "licence") return `Renew your ${licenceWord(row.counterparty)}`;
  if (row.direction === "owed") return `Collect from ${shortName(row.counterparty)}`;

  return `Pay ${shortName(row.counterparty)}`;
}

/** "36 days late" / "19 days left". The words carry the state; colour only repeats it. */
export function deadlineCount(row: DocumentRow, now: Date): string {
  const { days } = urgencyFor(row, now);

  if (days === null) return "no date";
  if (days < 0) return `${-days} days late`;
  if (days === 0) return "due today";
  if (days === 1) return "1 day left";

  return `${days} days left`;
}

export function isUrgent(row: DocumentRow, now: Date): boolean {
  return urgencyFor(row, now).tone === "stamp";
}

/** A figure we will not stand behind yet. Nothing can be filed until it clears. */
export function isBlocked(row: DocumentRow): boolean {
  return row.blockers.length > 0 || row.status === "refused";
}
