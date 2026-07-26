import type { Status } from "@/lib/types";
import type { DocumentRow } from "@/components/lib/documents";
import { shortName } from "@/components/lib/copy";
import { daysSince } from "@/components/lib/dates";
import { RECEIVABLE_OVERDUE_DAYS, urgencyFor } from "@/components/lib/urgency";

export const STATUS_LABEL: Record<Status, string> = {
  seeded: "Seeded",
  extracted: "Extracted",
  refused: "Refused",
  filed: "Filed",
};

export const STATUS_TAG: Record<Status, string> = {
  seeded: "tag-neutral",
  extracted: "tag-outline",
  refused: "tag-accent",
  filed: "tag-accent",
};

export function kindLabel(row: DocumentRow): string {
  if (row.doc_type === "gst_notice") return "Notice";
  if (row.doc_type === "licence") return "Licence";
  if (row.doc_type === "gst_return") return "Return";

  return row.direction === "owed" ? "Receivable" : "Invoice";
}

export function actionTitle(row: DocumentRow): string {
  if (row.doc_type === "gst_notice") return "Reply to the GST demand notice";
  if (row.doc_type === "gst_return") return `File ${row.return?.form ?? "the GST return"}`;
  if (row.doc_type === "licence") return "Renew the licence";
  if (row.direction === "owed") return `Collect from ${shortName(row.counterparty)}`;

  return `Pay ${shortName(row.counterparty)}`;
}

export function actionDetail(row: DocumentRow, now: Date): string {
  if (row.doc_type === "gst_notice") {
    return row.blockers.length > 0
      ? "Show cause notice · filing blocked until the checks pass"
      : "Show cause notice · reply in form DRC-06";
  }

  if (row.doc_type === "gst_return") {
    return `${row.return?.period_label ?? "Period not read"} · your own filing`;
  }

  if (row.doc_type === "licence") return "Registration renewal · apply before it expires";

  if (row.direction === "owed") {
    const age = daysSince(row.doc_date ?? row.deadline, now);

    return age !== null && age > RECEIVABLE_OVERDUE_DAYS
      ? `Unpaid ${age} days · MSMED section 15 claim available`
      : "Sales invoice · payment still due";
  }

  return "Purchase bill · payment due";
}

export function deadlineCount(row: DocumentRow, now: Date): string {
  const { days } = urgencyFor(row, now);

  if (days === null) return "no date";
  if (days < 0) return `${-days} days late`;
  if (days === 0) return "today";
  if (days === 1) return "1 day";

  return `${days} days`;
}

export function isUrgent(row: DocumentRow, now: Date): boolean {
  return urgencyFor(row, now).tone === "stamp";
}
