import type { DocumentRow } from "@/components/lib/documents";
import type { RateIndex } from "@/components/lib/rate";
import { traceBlockers } from "@/components/lib/blockers";
import { allegationHeading } from "@/components/lib/copy";
import { parseConsequence } from "@/components/lib/consequence";
import { buildFacts } from "@/components/lib/facts";
import { TONE_RULE_CLASSES, urgencyFor } from "@/components/lib/urgency";
import { ActionBar } from "./ActionBar";
import { AskPanel } from "./AskPanel";
import { DocumentHeader } from "./DocumentHeader";
import { TraceLayout } from "./TraceLayout";

interface DocumentDetailProps {
  row: DocumentRow;
  now: Date;
  rates: RateIndex;
}

function paragraphsOf(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function DocumentDetail({ row, now, rates }: DocumentDetailProps) {
  const blockers = traceBlockers(row);
  const blocked = blockers.length > 0;
  const urgency = urgencyFor(row, now);

  return (
    <article
      data-ground={blocked ? "refused" : undefined}
      className="flex min-h-[calc(100dvh-var(--identity-height))] flex-col"
    >
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

        <div className="mt-12 pb-4">
          <AskPanel row={row} />
        </div>
      </div>

      <div className="w-full max-w-[var(--content-max)]">
        <ActionBar
          documentId={row.id}
          canFile={row.doc_type === "gst_notice"}
          blocked={blocked}
          blockerCount={blockers.length}
          filedRef={row.file_url}
          rates={rates}
        />
      </div>
    </article>
  );
}
