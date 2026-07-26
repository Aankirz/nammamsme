import type { DocumentRow } from "@/components/lib/documents";
import type { RateIndex } from "@/components/lib/rate";
import { blockedReason, traceBlockers } from "@/components/lib/blockers";
import { allegationHeading, formatDate } from "@/components/lib/copy";
import { parseConsequence } from "@/components/lib/consequence";
import { buildFacts } from "@/components/lib/facts";
import { BUSINESS } from "@/components/lib/identity";
import { formatRupees } from "@/components/lib/money";
import { pagesIn } from "@/components/lib/source";
import { AskPanel } from "./AskPanel";
import { ChecksPanel } from "./ChecksPanel";
import { ConsequenceLadder } from "./ConsequenceLadder";
import { DetailBody } from "./DetailBody";
import { DocumentHeader } from "./DocumentHeader";
import { PlainWords } from "./PlainWords";

interface DocumentDetailProps {
  row: DocumentRow;
  now: Date;
  rates: RateIndex;
}

const FOOTNOTE =
  "Written from the digitised page. The amounts and the dates are locked by the checks that run before any of this text is produced.";

function paragraphsOf(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function pageLabelFor(row: DocumentRow): string {
  if (row.source === null) return "No page captured";
  const count = pagesIn(row.source).length;
  return `Digitised page · ${count} ${count === 1 ? "page" : "pages"}`;
}

export function DocumentDetail({ row, now, rates }: DocumentDetailProps) {
  const blockers = traceBlockers(row);
  const canFile = row.doc_type === "gst_notice";

  return (
    <DetailBody
      documentId={row.id}
      header={<DocumentHeader row={row} />}
      plainWords={
        <PlainWords
          heading={`${allegationHeading(row.doc_type)}, in plain words`}
          headingId="allegation-heading"
          paragraphs={paragraphsOf(row.obligation)}
          empty="Nothing has been read off this document yet."
          footnote={row.source ? FOOTNOTE : null}
        />
      }
      ladder={
        <ConsequenceLadder
          steps={parseConsequence(row.consequence)}
          headingId="consequence-heading"
        />
      }
      checks={row.source ? <ChecksPanel row={row} /> : null}
      ask={<AskPanel row={row} />}
      facts={buildFacts(row, now)}
      source={row.source}
      pageLabel={pageLabelFor(row)}
      blockers={blockers}
      blockedReason={blockedReason(blockers.length)}
      canFile={canFile}
      fileLabel="File the DRC-06 reply"
      confirm={[
        { label: "Amount demanded", value: formatRupees(row.amount) },
        { label: "Reply due by", value: formatDate(row.deadline) ?? "No date found" },
        { label: "Your GSTIN", value: BUSINESS.gstin },
      ]}
      filedRef={row.file_url}
      rates={rates}
    />
  );
}
