import Link from "next/link";
import type { ObligationRow } from "@/lib/types";
import { formatHindiDate, noAmountPhrase } from "@/components/lib/hindi";
import { hasAmount } from "@/components/lib/money";
import { chipForRow, STRIPE_CLASSES } from "@/components/lib/urgency";
import { DocTypeStamp } from "@/components/ui/DocTypeStamp";
import { Money } from "@/components/ui/Money";
import { UrgencyChip } from "@/components/ui/UrgencyChip";

/**
 * A licence has a date where a bill has a price. Rather than print an em-dash
 * in the biggest slot on the row, show the fact that actually matters.
 */
function HeroFact({ row }: { row: ObligationRow }) {
  if (hasAmount(row.amount)) {
    return (
      <Money
        amount={row.amount}
        size="sm"
        className={row.direction === "owed" ? "text-credit" : "text-ink"}
      />
    );
  }

  return (
    <span className="numerals text-money-sm font-semibold tracking-[-0.02em] text-ink">
      {formatHindiDate(row.deadline) ?? noAmountPhrase(row.doc_type)}
    </span>
  );
}

interface ObligationListItemProps {
  row: ObligationRow;
  now: Date;
  index: number;
}

export function ObligationListItem({
  row,
  now,
  index,
}: ObligationListItemProps) {
  const chip = chipForRow(row, now);
  const isBlocked = row.blockers.length > 0;
  const isReceivable = row.direction === "owed";

  return (
    <li
      className="rise"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <Link
        href={`/doc/${encodeURIComponent(row.id)}`}
        className="press-on-tap relative flex min-h-[5.5rem] gap-4 overflow-hidden rounded-card border border-rule bg-paper-raised py-4 pl-5 pr-4 shadow-card transition-transform hover:-translate-y-[1px]"
      >
        <span
          className={`absolute inset-y-0 left-0 w-[5px] ${STRIPE_CLASSES[chip.tone]}`}
          aria-hidden="true"
        />

        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex items-center gap-2">
            <DocTypeStamp docType={row.doc_type} />
            {isReceivable && (
              <span className="text-micro font-semibold text-credit">
                आना है
              </span>
            )}
            {isBlocked && (
              <span className="rounded-tag bg-danger px-1.5 py-0.5 text-tag font-bold uppercase text-ink-invert">
                रुका
              </span>
            )}
          </span>

          <span className="truncate text-lead font-semibold text-ink">
            {row.counterparty}
          </span>

          <span className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
            <HeroFact row={row} />
            <UrgencyChip chip={chip} />
          </span>
        </span>
      </Link>
    </li>
  );
}
