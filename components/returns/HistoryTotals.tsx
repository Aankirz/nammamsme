import { formatRupees } from "@/components/lib/money";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";
import type { HistoryTotals as Totals } from "./history";

interface HistoryTotalsProps {
  totals: Totals;
  periodCount: number;
}

interface CellProps {
  label: string;
  amount: number;
  note: string;
  tinted?: boolean;
}

function Cell({ label, amount, note, tinted = false }: CellProps) {
  return (
    <div
      className="border-b border-rule px-[var(--space-4)] py-[var(--space-4)] last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
      style={tinted ? { backgroundColor: "var(--color-accent-100)" } : undefined}
    >
      <Kicker style={{ letterSpacing: "0.14em", opacity: tinted ? 0.6 : 0.5 }}>
        {label}
      </Kicker>

      <p
        className={`numerals m-0 mt-[4px] font-[family-name:var(--font-heading)] text-[26px] leading-[1.08] font-semibold whitespace-nowrap ${
          tinted ? "text-[var(--color-accent-800)]" : ""
        }`}
      >
        {formatRupees(amount)}
      </p>

      <p className="m-0 mt-[6px] text-[11.5px] leading-[1.45] opacity-55 [text-wrap:pretty]">
        {note}
      </p>
    </div>
  );
}

function taxNote(count: number): string {
  if (count === 0) return "No return in this file has carried tax yet.";

  return count === 1
    ? "On the one return that carried tax."
    : `Across ${count} returns that carried tax.`;
}

function feeNote(running: number, count: number): string {
  if (running <= 0) return "Nothing here has ever gone late enough to cost a fee.";

  const returns = count === 1 ? "1 return" : `${count} returns`;

  return `${formatRupees(running)} is running now on ${returns} still open.`;
}

function creditNote(count: number, periods: number): string {
  if (count === 0) return "Every period matched what your suppliers reported.";

  return count === 1
    ? `From 1 period out of ${periods}.`
    : `From ${count} periods out of ${periods}.`;
}

export function HistoryTotals({ totals, periodCount }: HistoryTotalsProps) {
  return (
    <section aria-labelledby="totals-heading">
      <Kicker as="h2" id="totals-heading" className="mb-[var(--space-3)]">
        Across everything below
      </Kicker>

      <Blueprint>
        <div className="grid sm:grid-cols-3">
          <Cell
            label="Tax paid"
            amount={totals.taxPaid}
            note={taxNote(totals.taxPaidCount)}
          />

          <Cell
            label="Late fees paid"
            amount={totals.lateFeesPaid}
            note={feeNote(totals.lateFeesRunning, totals.lateFeesRunningCount)}
          />

          <Cell
            label="Credit your suppliers never reported"
            amount={totals.unmatched}
            note={creditNote(totals.unmatchedCount, periodCount)}
            tinted
          />
        </div>
      </Blueprint>
    </section>
  );
}
