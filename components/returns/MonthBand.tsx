import Link from "next/link";
import type { DocumentRow } from "@/components/lib/documents";
import { formatDate } from "@/components/lib/copy";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { monthsApartPhrase } from "@/components/lib/returns";
import { Blueprint } from "@/components/inbox/Blueprint";
import { MARK } from "@/components/inbox/styles";
import { Kicker } from "@/components/ui/Kicker";
import { PRIMARY_BUTTON } from "@/components/ui/buttons";
import { periodStanding, sentenceCase } from "./copy";
import { FormCell } from "./FormCell";
import { unmatchedOf, type HistoryEntry, type HistoryPeriod } from "./history";

const BAND_GRID =
  "grid gap-[var(--space-6)] md:grid-cols-[minmax(7rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)]";

interface MonthBandProps {
  period: HistoryPeriod;
  notice: DocumentRow | null;
  now: Date;
}

function PeriodLabel({ period, headingId }: { period: HistoryPeriod; headingId: string }) {
  const quiet = period.settled && period.causal === null;

  return (
    <div className="min-w-0">
      <h2
        id={headingId}
        className={`m-0 font-[family-name:var(--font-heading)] leading-[1.05] ${
          quiet ? "text-[20px] font-normal opacity-55" : "text-[25px] font-semibold"
        }`}
      >
        {period.label}
      </h2>

      <p
        className="m-0 mt-[6px]"
        style={
          period.settled
            ? MARK
            : { ...MARK, color: "var(--stamp)", opacity: 1, fontWeight: 600 }
        }
      >
        {periodStanding(period)}
      </p>
    </div>
  );
}

function CausalNote({ entry, notice }: { entry: HistoryEntry; notice: DocumentRow | null }) {
  const gap = unmatchedOf(entry.detail);
  if (gap <= 0) return null;

  const apart = monthsApartPhrase(
    entry.detail.filed_on ?? entry.endIso,
    notice?.doc_date ?? notice?.created_at ?? null,
  );

  return (
    <div className="mt-[var(--space-6)] grid gap-[var(--space-6)] border-t border-rule pt-[var(--space-6)] md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] md:items-end">
      <div className="min-w-0">
        <Kicker>The month that cost you</Kicker>

        <p className="numerals m-0 mt-[6px] font-[family-name:var(--font-heading)] text-[38px] leading-[0.95] font-semibold whitespace-nowrap text-[var(--color-accent-800)]">
          {formatRupees(gap)}
        </p>

        <p className="m-0 mt-[var(--space-3)] max-w-[54ch] text-[13.5px] [text-wrap:pretty]">
          Credit you claimed here that your suppliers never reported.
          {apart
            ? ` ${sentenceCase(apart)} later the department asked for it back.`
            : " The department asked for it back."}
        </p>
      </div>

      {notice ? (
        <div className="min-w-0">
          <Link
            href={`/doc/${encodeURIComponent(notice.id)}`}
            className={`${PRIMARY_BUTTON} btn-block justify-between`}
          >
            <span>Open the notice</span>
            {hasAmount(notice.amount) && (
              <span className="numerals">{formatRupees(notice.amount)}</span>
            )}
          </Link>

          {notice.deadline && (
            <p className="numerals m-0 mt-[var(--space-2)] text-[11.5px] opacity-60">
              Reply by {formatDate(notice.deadline)}.
            </p>
          )}
        </div>
      ) : (
        <p className="m-0 text-[12.5px] opacity-60">
          The notice it produced is not in this file.
        </p>
      )}
    </div>
  );
}

export function MonthBand({ period, notice, now }: MonthBandProps) {
  const headingId = `period-${period.startIso}`;
  const causal = period.causal;

  const band = (
    <div className={BAND_GRID}>
      <PeriodLabel period={period} headingId={headingId} />

      <FormCell
        slot="sales"
        entry={period.sales}
        months={period.months}
        now={now}
        gapShownBelow={causal !== null}
      />

      <FormCell
        slot="tax"
        entry={period.tax}
        months={period.months}
        now={now}
        gapShownBelow={causal !== null}
      />
    </div>
  );

  if (causal === null) {
    return (
      <section aria-labelledby={headingId} className="py-[var(--space-4)]">
        {band}
      </section>
    );
  }

  return (
    <Blueprint
      as="section"
      ariaLabelledBy={headingId}
      className="p-[var(--space-6)] md:p-[var(--space-8)]"
    >
      {band}
      <CausalNote entry={causal} notice={notice} />
    </Blueprint>
  );
}
