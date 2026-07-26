import type { ObligationRow } from "@/lib/types";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ObligationListItem } from "./ObligationListItem";

interface ObligationListProps {
  rows: readonly ObligationRow[];
  now: Date;
}

export function ObligationList({ rows, now }: ObligationListProps) {
  return (
    <section aria-labelledby="documents-heading" className="px-5 pt-6">
      <h2 id="documents-heading" className="mb-3">
        <SectionLabel className="text-ink-faint">आपके दस्तावेज़</SectionLabel>
      </h2>

      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <ObligationListItem
            key={row.id}
            row={row}
            now={now}
            index={index}
          />
        ))}
      </ul>
    </section>
  );
}
