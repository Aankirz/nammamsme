import Link from "next/link";
import type { DocumentRow } from "@/components/lib/documents";
import { computeExposure } from "@/components/lib/exposure";
import { groupRows, lateReturnCount } from "@/components/lib/returns";
import { ExposurePanel } from "./ExposurePanel";
import { RailRow } from "./RailRow";
import { ReturnRow } from "./ReturnRow";

interface RailProps {
  rows: readonly DocumentRow[];
  now: Date;
  selectedId?: string;
}

export function Rail({ rows, now, selectedId }: RailProps) {
  const exposure = computeExposure(rows, now);
  const { obligations, returns } = groupRows(rows, now);
  const late = lateReturnCount(returns, now);

  return (
    <div className="border-b border-rule bg-paper-sunk lg:sticky lg:top-[var(--identity-height)] lg:h-[calc(100dvh-var(--identity-height))] lg:overflow-y-auto lg:border-b-0 lg:border-r">
      {rows.length > 0 && <ExposurePanel exposure={exposure} />}

      <nav aria-label="Obligations" className="pb-6 pt-6">
        <h2 className="eyebrow px-6 pb-3">Obligations</h2>

        {obligations.length > 0 ? (
          <ul>
            {obligations.map((row) => (
              <RailRow
                key={row.id}
                row={row}
                now={now}
                current={row.id === selectedId}
              />
            ))}
          </ul>
        ) : (
          <p className="border-t border-rule px-6 pt-4 text-sm text-ink-muted">
            Nothing has been read yet. Add a document and its amount, date and
            consequence appear here.
          </p>
        )}

        <p className="px-6 pt-5">
          <Link
            href="/doc/new"
            className="rounded-sm text-xs font-semibold text-ink-muted underline decoration-rule-strong underline-offset-4 transition-colors duration-150 ease-[var(--ease-out)] hover:text-ink hover:decoration-ink"
          >
            Add a document
          </Link>
        </p>
      </nav>

      {returns.length > 0 && (
        <nav aria-label="Returns" className="border-t border-rule pb-7 pt-6">
          <div className="flex items-baseline justify-between gap-3 px-6 pb-3">
            <h2 className="eyebrow">Returns</h2>
            {late > 0 && (
              <p className="numerals font-mono text-xs font-semibold text-stamp">
                {late === 1 ? "1 not filed" : `${late} not filed`}
              </p>
            )}
          </div>

          <ul>
            {returns.map((row) => (
              <ReturnRow
                key={row.id}
                row={row}
                now={now}
                current={row.id === selectedId}
              />
            ))}
          </ul>

          <p className="px-6 pt-4 text-xs text-ink-faint">
            Filed returns need nothing from you.
          </p>
        </nav>
      )}
    </div>
  );
}
