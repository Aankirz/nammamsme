import type { DocumentRow } from "@/components/lib/documents";
import { DOC_TYPE_LABEL, formatDate } from "@/components/lib/copy";
import { urgencyFor } from "@/components/lib/urgency";
import { DayCount } from "@/components/ui/DayCount";

interface DocumentHeaderProps {
  row: DocumentRow;
  now: Date;
}

/** What arrived, from whom, and when. The figures sit directly below. */
export function DocumentHeader({ row, now }: DocumentHeaderProps) {
  const urgency = urgencyFor(row, now);
  const docDate = formatDate(row.doc_date);
  const blocked = row.blockers.length > 0;
  const filed = row.status === "filed";

  return (
    <header className="border-b border-rule pb-6 pt-7">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="eyebrow">{DOC_TYPE_LABEL[row.doc_type]}</span>
        {blocked && (
          <span className="numerals rounded-sm border border-stamp-rule bg-stamp-tint px-1.5 py-px font-mono text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
            Refused
          </span>
        )}
        {filed && (
          <span className="numerals rounded-sm border border-rule px-1.5 py-px font-mono text-xs font-semibold uppercase tracking-[0.08em] text-settled">
            Filed
          </span>
        )}
      </p>

      <h1 className="mt-2 max-w-[36ch] text-xl font-semibold text-ink">
        {row.counterparty || "Sender not named"}
      </h1>

      <p className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-muted">
        {docDate && (
          <span className="numerals">
            Dated <span className="font-mono">{docDate}</span>
          </span>
        )}
        <DayCount text={urgency.phrase} tone={urgency.tone} />
      </p>
    </header>
  );
}
