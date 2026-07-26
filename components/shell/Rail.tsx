import Link from "next/link";
import type { DocumentRow } from "@/components/lib/documents";
import { computeExposure } from "@/components/lib/exposure";
import { ExposurePanel } from "./ExposurePanel";
import { RailRow } from "./RailRow";

interface RailProps {
  rows: readonly DocumentRow[];
  now: Date;
  selectedId?: string;
}

/**
 * The persistent left rail. Selection lives here and survives navigation, so
 * the owner never loses his place in the file.
 *
 * Below 1024px this becomes a top list. That is the only responsive
 * concession, and it is structural: nothing about the type changes.
 */
export function Rail({ rows, now, selectedId }: RailProps) {
  const exposure = computeExposure(rows, now);

  return (
    <div className="border-b border-rule bg-paper-sunk lg:sticky lg:top-[var(--identity-height)] lg:h-[calc(100dvh-var(--identity-height))] lg:overflow-y-auto lg:border-b-0 lg:border-r">
      {rows.length > 0 && <ExposurePanel exposure={exposure} />}

      <nav aria-label="Obligations" className="pb-6 pt-6">
        <h2 className="eyebrow px-6 pb-3">Obligations</h2>

        {rows.length > 0 ? (
          <ul>
            {rows.map((row) => (
              <RailRow key={row.id} row={row} now={now} current={row.id === selectedId} />
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
    </div>
  );
}
