import type { ReturnFact } from "@/components/lib/returns";
import { TONE_TEXT_CLASSES } from "@/components/lib/urgency";
import { Money } from "@/components/ui/Money";

interface ReturnFactsProps {
  facts: readonly ReturnFact[];
}

function Value({ fact }: { fact: ReturnFact }) {
  if (fact.variant === "money" && fact.amount !== null) {
    return (
      <Money
        amount={fact.amount}
        size={fact.tone === "stamp" ? "lg" : "hero"}
        className={fact.tone === "stamp" ? "text-stamp" : "text-ink"}
      />
    );
  }

  if (fact.variant === "reference") {
    return (
      <span className="numerals font-mono text-lg font-semibold tracking-[0.02em] text-ink">
        {fact.value}
      </span>
    );
  }

  return (
    <span className="numerals font-mono text-xl font-semibold text-ink">
      {fact.value}
    </span>
  );
}

export function ReturnFacts({ facts }: ReturnFactsProps) {
  return (
    <dl>
      {facts.map((fact) => (
        <div key={fact.id} className="border-b border-rule py-4 first:pt-0">
          <dt className="eyebrow">{fact.label}</dt>
          <dd className="mt-1.5">
            <Value fact={fact} />
            {fact.note && (
              <p
                className={`numerals mt-1.5 text-sm ${
                  fact.tone ? TONE_TEXT_CLASSES[fact.tone] : "text-ink-muted"
                }`}
              >
                {fact.note}
              </p>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
