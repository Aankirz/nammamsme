import Link from "next/link";
import type { DocumentRow } from "@/components/lib/documents";
import { formatDateShort, shortName } from "@/components/lib/copy";
import { hasAmount } from "@/components/lib/money";
import { TONE_RULE_CLASSES, urgencyFor } from "@/components/lib/urgency";
import { DayCount } from "@/components/ui/DayCount";
import { DocTypeStamp } from "@/components/ui/DocTypeStamp";
import { Money } from "@/components/ui/Money";

interface RailRowProps {
  row: DocumentRow;
  now: Date;
  current: boolean;
}

/**
 * One obligation in the rail.
 *
 * The 2px rule along the top is the state signal and doubles as the divider,
 * so urgency is legible before a word is read. Selection is a full inset
 * border and a raised ground, never a coloured left edge.
 */
export function RailRow({ row, now, current }: RailRowProps) {
  const urgency = urgencyFor(row, now);
  const blocked = row.blockers.length > 0;
  const priced = hasAmount(row.amount);

  return (
    <li>
      <Link
        href={`/doc/${encodeURIComponent(row.id)}`}
        aria-current={current ? "page" : undefined}
        data-current={current}
        className="relative block px-6 py-3 transition-colors duration-150 ease-[var(--ease-out)] hover:bg-paper-raised active:bg-rule data-[current=true]:bg-paper-raised data-[current=true]:shadow-[inset_0_0_0_1px_var(--ink)]"
      >
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-[2px] ${TONE_RULE_CLASSES[urgency.tone]}`}
        />

        <span className="flex items-center gap-2">
          <DocTypeStamp docType={row.doc_type} />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
            {shortName(row.counterparty) || "Not named"}
          </span>
          {blocked && (
            <span className="numerals rounded-sm bg-stamp-tint px-1.5 py-px font-mono text-xs font-semibold uppercase tracking-[0.06em] text-stamp">
              Blocked
            </span>
          )}
        </span>

        <span className="mt-2 flex items-baseline gap-3">
          {priced ? (
            <Money
              amount={row.amount}
              size="md"
              className={row.direction === "owed" ? "text-settled" : "text-ink"}
            />
          ) : (
            <span className="numerals font-mono text-lg font-semibold text-ink">
              {formatDateShort(row.deadline) ?? "No date"}
            </span>
          )}
          <DayCount text={urgency.count} tone={urgency.tone} className="ml-auto" />
        </span>
      </Link>
    </li>
  );
}
