import type { DocumentRow } from "@/components/lib/documents";
import { traceBlockers } from "@/components/lib/blockers";
import { allegationHeading } from "@/components/lib/copy";
import { parseConsequence } from "@/components/lib/consequence";
import { buildFacts } from "@/components/lib/facts";
import { TONE_RULE_CLASSES, urgencyFor } from "@/components/lib/urgency";
import { ActionBar } from "./ActionBar";
import { DocumentHeader } from "./DocumentHeader";
import { TraceLayout } from "./TraceLayout";

interface DocumentDetailProps {
  row: DocumentRow;
  now: Date;
}

function paragraphsOf(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * One document, open. Everything that can be established sits on the left and
 * the page it was read off sits on the right, so nothing has to be taken on
 * trust.
 */
export function DocumentDetail({ row, now }: DocumentDetailProps) {
  const blockers = traceBlockers(row);
  const blocked = blockers.length > 0;
  const urgency = urgencyFor(row, now);

  return (
    <article
      data-ground={blocked ? "refused" : undefined}
      className="flex min-h-[calc(100dvh-var(--identity-height))] flex-col"
    >
      {/* The state of the open file, legible across the whole pane before a
          word of it is read. */}
      <span
        aria-hidden="true"
        className={`block h-[2px] w-full ${TONE_RULE_CLASSES[urgency.tone]}`}
      />

      <div className="w-full max-w-[var(--content-max)] flex-1 px-8">
        <DocumentHeader row={row} now={now} />

        <div className="pt-8">
          <TraceLayout
            facts={buildFacts(row, now)}
            obligation={paragraphsOf(row.obligation)}
            consequence={parseConsequence(row.consequence)}
            blockers={blockers}
            source={row.source}
            obligationHeading={allegationHeading(row.doc_type)}
          />
        </div>
      </div>

      <div className="w-full max-w-[var(--content-max)]">
        <ActionBar
          documentId={row.id}
          canFile={row.doc_type === "gst_notice"}
          blocked={blocked}
          blockerCount={blockers.length}
          filedRef={row.file_url}
        />
      </div>
    </article>
  );
}
