import type { Exposure, ExposureHighlight } from "@/components/lib/exposure";
import { documentCountPhrase } from "@/components/lib/hindi";
import { formatRupees } from "@/components/lib/money";
import { STRIPE_CLASSES, TONE_TEXT_CLASSES } from "@/components/lib/urgency";
import { Money } from "@/components/ui/Money";

interface ExposureHeadlineProps {
  exposure: Exposure;
}

function HighlightLine({
  highlight,
  index,
}: {
  highlight: ExposureHighlight;
  index: number;
}) {
  return (
    <li
      className="rise flex items-stretch gap-3"
      style={{ animationDelay: `${120 + index * 70}ms` }}
    >
      <span
        className={`w-1 shrink-0 rounded-full ${STRIPE_CLASSES[highlight.tone]}`}
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 py-1">
        {highlight.amount !== null && (
          <span
            className={`numerals text-lead font-bold ${TONE_TEXT_CLASSES[highlight.tone]}`}
          >
            {formatRupees(highlight.amount)}
          </span>
        )}
        <span className="text-body font-medium text-ink">
          {highlight.label}
        </span>
        <span className="numerals ml-auto text-label font-semibold text-ink-faint">
          {highlight.timing}
        </span>
      </span>
    </li>
  );
}

/**
 * The most important element in the product. One number the trader has never
 * seen before: what the next thirty days will take out of his account.
 */
export function ExposureHeadline({ exposure }: ExposureHeadlineProps) {
  const hasReceivable = exposure.owedOverdue > 0;

  return (
    <section
      aria-labelledby="exposure-heading"
      className="border-b border-rule px-5 pb-6 pt-6"
    >
      <h1 id="exposure-heading" className="rise">
        <span className="block text-label font-semibold uppercase tracking-[0.1em] text-ink-faint">
          अगले 30 दिनों में देना है
        </span>
        <Money
          amount={exposure.owingWithin30}
          size="hero"
          className="mt-1 text-ink"
        />
      </h1>

      <p className="numerals mt-2 text-micro text-ink-faint">
        {documentCountPhrase(exposure.owingWithin30Count)} पर तारीख़ पास है
      </p>

      {hasReceivable && (
        <p
          className="rise mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-card border border-credit-rule bg-credit-wash px-3 py-3"
          style={{ animationDelay: "90ms" }}
        >
          <span className="numerals text-money-sm font-bold text-credit">
            {formatRupees(exposure.owedOverdue)}
          </span>
          <span className="text-body font-medium text-credit">
            आपको मिलना बाकी है
          </span>
          <span className="numerals ml-auto text-micro font-semibold text-credit">
            45 दिन से ऊपर
          </span>
        </p>
      )}

      {exposure.highlights.length > 0 && (
        <ul className="mt-5 flex flex-col gap-3">
          {exposure.highlights.map((highlight, index) => (
            <HighlightLine
              key={highlight.id}
              highlight={highlight}
              index={index}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
