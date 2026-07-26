import type { DocumentRow } from "@/components/lib/documents";
import { DOC_TYPE_LABEL } from "@/components/lib/copy";
import { Kicker } from "@/components/ui/Kicker";
import { inRupees } from "@/components/lib/money";

interface DocumentHeaderProps {
  row: DocumentRow;
}

const SENTENCE_END = /(?<=\.)\s+/;

function titleOf(row: DocumentRow): string {
  const first = row.obligation.split(SENTENCE_END)[0]?.trim();
  if (first && first.length > 8) return inRupees(first);
  return row.counterparty || "Document";
}

export function DocumentHeader({ row }: DocumentHeaderProps) {
  const blocked = row.blockers.length > 0;
  const filed = row.status === "filed";

  return (
    <header>
      <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Kicker>{DOC_TYPE_LABEL[row.doc_type]}</Kicker>

        {blocked && (
          <span className="tag border border-stamp text-[10px] tracking-[0.08em] text-stamp uppercase">
            Refused
          </span>
        )}

        {filed && (
          <span className="tag tag-outline text-[10px] tracking-[0.08em] uppercase">
            Filed
          </span>
        )}
      </div>

      <h1 className="m-0 max-w-[26ch] text-[34px] leading-[1.02] font-semibold">
        {titleOf(row)}
      </h1>
    </header>
  );
}
