import type { Exposure, ExposureLine } from "@/components/lib/exposure";
import { documentCountPhrase } from "@/components/lib/copy";
import { formatRupees } from "@/components/lib/money";
import { TONE_RULE_CLASSES } from "@/components/lib/urgency";
import { DayCount } from "@/components/ui/DayCount";
import { Money } from "@/components/ui/Money";

interface ExposurePanelProps {
  exposure: Exposure;
}

function Line({ line }: { line: ExposureLine }) {
  return (
    <li className="relative flex items-baseline gap-3 py-2">
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-[2px] ${TONE_RULE_CLASSES[line.tone]}`}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{line.label}</span>
      {line.amount === null ? (
        <span className="text-xs text-ink-faint">no amount</span>
      ) : (
        <Money amount={line.amount} size="sm" className="text-ink" />
      )}
      <DayCount text={line.count} tone={line.tone} className="w-[4.75rem] text-right" />
    </li>
  );
}

/**
 * The one number the owner has never seen: what the next thirty days take out
 * of his account. Everything under it says where that number comes from, and
 * the last line says what would cover it.
 */
export function ExposurePanel({ exposure }: ExposurePanelProps) {
  const { collection } = exposure;

  return (
    <section aria-labelledby="exposure-heading" className="border-b border-rule px-6 pb-7 pt-6">
      <h2 id="exposure-heading" className="eyebrow">
        Exposure
      </h2>

      <p className="mt-3">
        <Money amount={exposure.movingWithin30} size="lg" className="text-ink" />
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        moving in the next 30 days, across {documentCountPhrase(exposure.documentCount)}
      </p>

      {exposure.lines.length > 0 && (
        <ul className="mt-5">
          {exposure.lines.map((line) => (
            <Line key={line.id} line={line} />
          ))}
        </ul>
      )}

      {collection && (
        <p className="mt-5 border-t border-rule pt-4 text-sm text-ink-muted">
          <span className="numerals font-mono font-semibold text-ink">
            {formatRupees(collection.amount)}
          </span>{" "}
          from {collection.counterparty} has been unpaid for{" "}
          <span className="numerals font-mono">{collection.days}</span> days. Collecting it
          covers {collection.coversAll ? "all" : "part"} of the above.
        </p>
      )}
    </section>
  );
}
