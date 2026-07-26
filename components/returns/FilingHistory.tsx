import type { DocumentRow } from "@/components/lib/documents";
import { findDocument } from "@/components/lib/documents";
import { MonthBand } from "./MonthBand";
import type { HistoryPeriod } from "./history";

interface FilingHistoryProps {
  periods: readonly HistoryPeriod[];
  rows: readonly DocumentRow[];
  now: Date;
}

function noticeFor(
  period: HistoryPeriod,
  rows: readonly DocumentRow[],
): DocumentRow | null {
  const id = period.causal?.detail.led_to;

  return typeof id === "string" ? findDocument(rows, id) : null;
}

export function FilingHistory({ periods, rows, now }: FilingHistoryProps) {
  const marked = periods.map((period, index) => ({
    period,
    opensYear: index === 0 || periods[index - 1].year !== period.year,
  }));

  return (
    <section
      aria-label="Filing history, newest first"
      className="mt-[calc(var(--space-8)*1.6)] grid gap-[calc(var(--space-8)*1.2)]"
    >
      {marked.map(({ period, opensYear }) => (
        <div key={period.key} className="min-w-0">
          {opensYear && (
            <p className="eyebrow numerals m-0 mb-[var(--space-4)]">{period.year}</p>
          )}

          <MonthBand period={period} notice={noticeFor(period, rows)} now={now} />
        </div>
      ))}
    </section>
  );
}
