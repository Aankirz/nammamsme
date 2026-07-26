import type { ReactNode } from "react";
import type { ReturnDetail as Detail } from "@/lib/types";
import type { DocumentRow } from "@/components/lib/documents";
import { parseConsequence } from "@/components/lib/consequence";
import { formatDate } from "@/components/lib/copy";
import {
  buildReturnFacts,
  reconciliationFor,
  returnStatus,
  type ReturnStatus,
} from "@/components/lib/returns";
import { TONE_RULE_CLASSES } from "@/components/lib/urgency";
import { DayCount } from "@/components/ui/DayCount";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AskPanel } from "./AskPanel";
import { ConsequenceLadder } from "./ConsequenceLadder";
import { ReconciliationPanel } from "./ReconciliationPanel";
import { ReturnActionBar } from "./ReturnActionBar";
import { ReturnFacts } from "./ReturnFacts";

interface ReturnDetailProps {
  row: DocumentRow;
  notice: DocumentRow | null;
  now: Date;
}

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

function Chip({ standing }: { standing: ReturnStatus["standing"] }) {
  if (standing === "overdue") {
    return (
      <span className="numerals rounded-sm border border-stamp-rule bg-stamp-tint px-1.5 py-px font-mono text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
        Not filed
      </span>
    );
  }

  if (standing === "filed") {
    return (
      <span className="numerals rounded-sm border border-rule px-1.5 py-px font-mono text-xs font-semibold uppercase tracking-[0.08em] text-settled">
        Filed
      </span>
    );
  }

  if (standing === "due") {
    return (
      <span className="numerals rounded-sm border border-rule px-1.5 py-px font-mono text-xs font-semibold uppercase tracking-[0.08em] text-pending">
        Due
      </span>
    );
  }

  return null;
}

function Header({
  detail,
  status,
  range,
}: {
  detail: Detail | null;
  status: ReturnStatus;
  range: string | null;
}) {
  const title = detail
    ? `${detail.form}${detail.period_label ? `, ${detail.period_label}` : ""}`
    : "GST return";

  return (
    <header className="border-b border-rule pb-6 pt-7">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="eyebrow">GST return</span>
        <Chip standing={status.standing} />
      </p>

      <h1 className="mt-2 max-w-[36ch] text-xl font-semibold text-ink">{title}</h1>

      <p className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-muted">
        {range && (
          <span className="numerals">
            Covers <span className="font-mono">{range}</span>
          </span>
        )}
        <DayCount text={status.phrase} tone={status.countTone} />
      </p>
    </header>
  );
}

function Blocking({ blocks }: { blocks: readonly string[] }) {
  return (
    <section
      aria-labelledby="blocking-heading"
      className="border border-stamp-rule bg-paper-raised"
    >
      <span aria-hidden="true" className="block h-[2px] w-full bg-stamp" />

      <div className="px-6 pb-5 pt-5">
        <h2 id="blocking-heading" className="eyebrow">
          What this is already holding up
        </h2>

        <ul className="mt-3 flex flex-col gap-px bg-rule">
          {blocks.map((entry, index) => (
            <li key={index} className="bg-paper-raised py-3 text-base text-ink">
              {entry}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Unread({ row }: { row: DocumentRow }) {
  const lines = paragraphsOf(row.obligation);

  return (
    <section aria-labelledby="unread-heading" className="mt-10 max-w-[62ch]">
      <SectionHeading>
        <span id="unread-heading">What this return covers</span>
      </SectionHeading>

      <div className="mt-3">
        {lines.length > 0 ? (
          lines.map((line, index) => (
            <p key={index} className="text-base text-ink [&:not(:first-child)]:mt-3">
              {line}
            </p>
          ))
        ) : (
          <p className="text-base text-ink-muted">
            The form, the period and the filing state have not been read off this
            return yet. Nothing about it is being asserted.
          </p>
        )}
      </div>
    </section>
  );
}

export function ReturnDetail({ row, notice, now }: ReturnDetailProps) {
  const detail = row.return;
  const status = returnStatus(row, now);
  const reconciliation = reconciliationFor(detail);
  const steps = detail && detail.state !== "filed" ? parseConsequence(row.consequence) : [];
  const blocks = detail?.blocks ?? [];
  const prose = paragraphsOf(row.obligation);

  const secondColumn: ReactNode =
    reconciliation && detail ? (
      <>
        <ReconciliationPanel
          detail={detail}
          reconciliation={reconciliation}
          notice={notice}
        />
        {blocks.length > 0 && (
          <div className="mt-8">
            <Blocking blocks={blocks} />
          </div>
        )}
      </>
    ) : blocks.length > 0 || steps.length > 0 ? (
      <>
        {blocks.length > 0 && <Blocking blocks={blocks} />}
        <ConsequenceLadder
          steps={steps}
          headingId="return-consequence-heading"
          className={blocks.length > 0 ? "mt-8" : ""}
        />
      </>
    ) : null;

  const twoUp = secondColumn !== null;

  return (
    <article className="flex min-h-[calc(100dvh-var(--identity-height))] flex-col">
      <span
        aria-hidden="true"
        className={`block h-[2px] w-full ${TONE_RULE_CLASSES[status.ruleTone]}`}
      />

      <div className="w-full max-w-[var(--content-max)] flex-1 px-8">
        <Header detail={detail} status={status} range={periodRange(detail)} />

        <div className="pt-8">
          <div
            className={
              twoUp
                ? "grid gap-x-10 gap-y-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                : "max-w-[68ch]"
            }
          >
            <div className="min-w-0">
              {detail === null ? (
                <Unread row={row} />
              ) : (
                <>
                  <ReturnFacts facts={buildReturnFacts(row, detail, now)} />

                  <section aria-labelledby="covers-heading" className="mt-10">
                    <SectionHeading>
                      <span id="covers-heading">What this return covers</span>
                    </SectionHeading>

                    <div className="mt-3 max-w-[62ch]">
                      {prose.length > 0 ? (
                        prose.map((line, index) => (
                          <p
                            key={index}
                            className="text-base text-ink [&:not(:first-child)]:mt-3"
                          >
                            {line}
                          </p>
                        ))
                      ) : (
                        <p className="text-base text-ink-muted">
                          Nothing beyond the figures has been recorded against this
                          period.
                        </p>
                      )}
                    </div>
                  </section>

                  {reconciliation === null && steps.length === 0 && blocks.length === 0 && (
                    <p className="mt-8 text-sm text-ink-muted">
                      This return is settled. Nothing here needs anything from you.
                    </p>
                  )}

                  {reconciliation !== null && steps.length > 0 && (
                    <ConsequenceLadder
                      steps={steps}
                      headingId="return-consequence-heading"
                    />
                  )}
                </>
              )}
            </div>

            {twoUp && (
              <div className="min-w-0 xl:sticky xl:top-[calc(var(--identity-height)+2rem)] xl:self-start">
                {secondColumn}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pb-4">
          <AskPanel row={row} />
        </div>
      </div>

      <div className="w-full max-w-[var(--content-max)]">
        <ReturnActionBar
          form={detail?.form ?? "return"}
          filed={detail?.state === "filed"}
          alarmed={status.standing === "overdue"}
        />
      </div>
    </article>
  );
}
