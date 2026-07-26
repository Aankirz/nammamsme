import type { Metadata } from "next";
import Link from "next/link";
import { fetchDocuments } from "@/components/lib/documents";
import { KICKER, LEAD, PAGE } from "@/components/inbox/styles";
import { Shell } from "@/components/shell/Shell";
import { Kicker } from "@/components/ui/Kicker";
import { PRIMARY_BUTTON } from "@/components/ui/buttons";
import { CloseOut } from "@/components/returns/CloseOut";
import { FilingHistory } from "@/components/returns/FilingHistory";
import { HistoryTotals } from "@/components/returns/HistoryTotals";
import {
  buildHistory,
  openReturns,
  totalsFor,
  unfiledPeriodCount,
} from "@/components/returns/history";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Filing history",
};

const LEDE =
  "Every GST return in this file, newest first. Each period carries two: one for what you sold, one for the summary and the tax.";

function Empty() {
  return (
    <section aria-labelledby="empty-heading">
      <Kicker as="h2" id="empty-heading" className="mb-[var(--space-3)]">
        Nothing to show yet
      </Kicker>

      <p className="m-0 max-w-[62ch] text-[15px] leading-[1.5] [text-wrap:pretty]">
        No GST return in this file has a period read off it, so there is no history to
        lay out. Nothing is being assumed on your behalf.
      </p>

      <div className="mt-[var(--space-4)]">
        <Link href="/" className={PRIMARY_BUTTON}>
          Back to the inbox
        </Link>
      </div>
    </section>
  );
}

export default async function ReturnsPage() {
  const now = new Date();
  const rows = await fetchDocuments();
  const periods = buildHistory(rows);
  const totals = totalsFor(periods);
  const open = openReturns(periods);
  const unreadable = unfiledPeriodCount(rows);

  return (
    <Shell now={now}>
      <div style={PAGE}>
        <header className="mb-[calc(var(--space-8)*1.4)]">
          <p style={KICKER} className="m-0">
            Your GST filing history
          </p>

          <h1 style={LEAD} className="mt-[var(--space-3)] max-w-[16ch]">
            What you have filed
          </h1>

          <p className="m-0 mt-[var(--space-4)] max-w-[62ch] text-[14px] leading-[1.55] opacity-70 [text-wrap:pretty]">
            {LEDE}
          </p>
        </header>

        {periods.length === 0 ? (
          <Empty />
        ) : (
          <>
            <HistoryTotals totals={totals} periodCount={periods.length} />
            <FilingHistory periods={periods} rows={rows} now={now} />

            {unreadable > 0 && (
              <p className="m-0 mt-[var(--space-6)] text-[11.5px] opacity-45">
                {unreadable === 1
                  ? "1 return in this file has no period read off it, so it is not placed above."
                  : `${unreadable} returns in this file have no period read off them, so they are not placed above.`}
              </p>
            )}

            <CloseOut open={open} now={now} />
          </>
        )}
      </div>
    </Shell>
  );
}
