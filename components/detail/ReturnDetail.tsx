import type { FilledForm as Filled } from "@/lib/forms";
import type { ReturnDetail as Detail } from "@/lib/types";
import type { DocumentRow } from "@/components/lib/documents";
import { parseConsequence } from "@/components/lib/consequence";
import { formatDate } from "@/components/lib/copy";
import { inRupees } from "@/components/lib/money";
import {
  buildReturnFacts,
  reconciliationFor,
  returnStatus,
  type ReturnStatus,
} from "@/components/lib/returns";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";
import { AskPanel } from "./AskPanel";
import { ConsequenceLadder } from "./ConsequenceLadder";
import { FilledForm } from "./FilledForm";
import { PlainWords } from "./PlainWords";
import { ReconciliationPanel } from "./ReconciliationPanel";
import { ReturnFacts } from "./ReturnFacts";

interface ReturnDetailProps {
  row: DocumentRow;
  notice: DocumentRow | null;
  now: Date;
  filled: Filled | null;
}

const FILED_LEDE =
  "This return is already filed. Below is every value it was filed on, written out so you can check it against the portal line by line.";

function paragraphsOf(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function periodRange(detail: Detail | null): string | null {
  const from = formatDate(detail?.period_start);
  const to = formatDate(detail?.period_end);

  return from && to ? `${from} to ${to}` : null;
}

function Standing({ standing }: { standing: ReturnStatus["standing"] }) {
  if (standing === "overdue") {
    return (
      <span className="tag border border-stamp text-[10px] tracking-[0.08em] text-stamp uppercase">
        Not filed
      </span>
    );
  }

  if (standing === "filed") {
    return (
      <span className="tag tag-neutral text-[10px] tracking-[0.08em] uppercase">
        Filed
      </span>
    );
  }

  if (standing === "due") {
    return (
      <span className="tag tag-outline text-[10px] tracking-[0.08em] uppercase">
        Open
      </span>
    );
  }

  return null;
}

function Blocking({ blocks }: { blocks: readonly string[] }) {
  return (
    <section aria-labelledby="blocking-heading">
      <Kicker as="h2" id="blocking-heading" className="mb-[var(--space-3)]">
        What this is already holding up
      </Kicker>

      <div className="border border-rule">
        {blocks.map((entry, index) => (
          <p
            key={index}
            className="border-b border-rule px-[var(--space-4)] py-[var(--space-3)] text-[13.5px] last:border-b-0 [text-wrap:pretty]"
          >
            {inRupees(entry)}
          </p>
        ))}
      </div>
    </section>
  );
}

export function ReturnDetail({ row, notice, now, filled }: ReturnDetailProps) {
  const detail = row.return;
  const isFiled = detail?.state === "filed";
  const status = returnStatus(row, now);
  const reconciliation = reconciliationFor(detail);
  const steps = detail && detail.state !== "filed" ? parseConsequence(row.consequence) : [];
  const blocks = detail?.blocks ?? [];
  const range = periodRange(detail);

  const title = detail
    ? `${detail.form}${detail.period_label ? `, ${detail.period_label}` : ""}`
    : "GST return";

  return (
    <div className="grid items-start gap-[var(--space-8)] lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="grid min-w-0 gap-[var(--space-8)]">
        <header>
          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Kicker>
              GST return{range ? ` · covers ${range}` : ""}
            </Kicker>
            <Standing standing={status.standing} />
          </div>

          <h1 className="m-0 max-w-[26ch] text-[34px] leading-[1.02] font-semibold">
            {title}
          </h1>
        </header>

        {detail && <ReturnFacts facts={buildReturnFacts(row, detail, now)} />}

        <PlainWords
          heading="What this return covers, in plain words"
          headingId="return-covers-heading"
          paragraphs={paragraphsOf(row.obligation)}
          empty="The form, the period and the filing state have not been read off this return yet. Nothing about it is being asserted."
        />

        <ConsequenceLadder steps={steps} headingId="return-consequence-heading" />

        {filled && (
          <FilledForm filled={filled} lede={isFiled ? FILED_LEDE : undefined} />
        )}

        <AskPanel row={row} />
      </div>

      <div className="grid min-w-0 gap-[var(--space-6)] lg:sticky lg:top-[76px]">
        {reconciliation && detail && (
          <ReconciliationPanel
            detail={detail}
            reconciliation={reconciliation}
            notice={notice}
          />
        )}

        {blocks.length > 0 && <Blocking blocks={blocks} />}

        {detail === null ? (
          <Blueprint as="section" className="p-[var(--space-6)]">
            <Kicker as="h2">Nothing read off this return</Kicker>
            <p className="mt-2 text-[12.5px] opacity-70 [text-wrap:pretty]">
              Until the form and the period are established, no action is offered
              against it.
            </p>
          </Blueprint>
        ) : (
          <ReturnFilePanel form={detail.form} filed={detail.state === "filed"} />
        )}
      </div>
    </div>
  );
}
