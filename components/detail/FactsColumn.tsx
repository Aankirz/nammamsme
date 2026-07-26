"use client";

import type { ConsequenceStep } from "@/components/lib/consequence";
import type { Fact } from "@/components/lib/facts";
import type { BlockKey } from "@/components/lib/source";
import { TONE_TEXT_CLASSES } from "@/components/lib/urgency";
import { Money } from "@/components/ui/Money";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpeakButton } from "@/components/ui/SpeakButton";

interface FactsColumnProps {
  facts: readonly Fact[];
  obligation: readonly string[];
  consequence: readonly ConsequenceStep[];
  /** "What they say you did" on a notice, plainer on anything else. */
  obligationHeading: string;
  active: BlockKey | null;
  onSelect: (key: BlockKey) => void;
  /** False when there is no page to trace to, so nothing pretends to be a link. */
  traceable: boolean;
}

function FactValue({ fact }: { fact: Fact }) {
  if (fact.variant === "money" && fact.amount !== null) {
    return <Money amount={fact.amount} size="hero" className="text-ink" />;
  }

  if (fact.variant === "date") {
    return (
      <span className="numerals font-mono text-xl font-semibold text-ink">
        {fact.value}
      </span>
    );
  }

  return <span className="text-xl font-semibold text-ink">{fact.value}</span>;
}

function FactRow({
  fact,
  active,
  onSelect,
  traceable,
}: {
  fact: Fact;
  active: BlockKey | null;
  onSelect: (key: BlockKey) => void;
  traceable: boolean;
}) {
  const key = fact.blockKey;
  const canTrace = traceable && key !== null;
  const isActive = canTrace && key === active;

  return (
    <div className="flex items-start gap-3 border-b border-rule py-4 first:pt-0">
      <div className="min-w-0 flex-1">
        <h3 className="eyebrow">{fact.label}</h3>

        <div className="mt-1.5">
          {canTrace ? (
            <button
              type="button"
              data-active={isActive}
              aria-pressed={isActive}
              onClick={() => onSelect(key)}
              className="rounded-sm px-1 py-0.5 -mx-1 text-left underline decoration-rule-strong decoration-dotted decoration-2 underline-offset-[6px] transition-colors duration-150 ease-[var(--ease-out)] hover:bg-paper-sunk hover:decoration-ink active:bg-rule data-[active=true]:bg-paper-sunk data-[active=true]:decoration-ink data-[active=true]:decoration-solid"
            >
              <FactValue fact={fact} />
              <span className="sr-only"> Show where this came from on the page</span>
            </button>
          ) : (
            <FactValue fact={fact} />
          )}
        </div>

        {fact.note && (
          <p
            className={`numerals mt-1.5 text-sm ${
              fact.tone ? TONE_TEXT_CLASSES[fact.tone] : "text-ink-muted"
            }`}
          >
            {fact.note}
          </p>
        )}
      </div>

      <SpeakButton text={fact.speech} label={fact.speechLabel} />
    </div>
  );
}

function Consequence({ steps }: { steps: readonly ConsequenceStep[] }) {
  if (steps.length === 0) return null;

  return (
    <section aria-labelledby="consequence-heading" className="mt-10">
      <SectionHeading>
        <span id="consequence-heading">What happens if you ignore this</span>
      </SectionHeading>

      <ol className="mt-1">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3 border-b border-rule py-3">
            <span
              aria-hidden="true"
              className="numerals mt-px w-4 shrink-0 font-mono text-xs text-ink-faint"
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              {step.when && (
                <span className="numerals mr-2 font-mono text-sm font-semibold text-stamp">
                  {step.when}
                </span>
              )}
              <span className="text-base text-ink">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * What the paper says, in the owner's words, with every figure tied back to
 * the page beside it.
 */
export function FactsColumn({
  facts,
  obligation,
  consequence,
  obligationHeading,
  active,
  onSelect,
  traceable,
}: FactsColumnProps) {
  return (
    <div>
      <div>
        {facts.map((fact) => (
          <FactRow
            key={fact.id}
            fact={fact}
            active={active}
            onSelect={onSelect}
            traceable={traceable}
          />
        ))}
      </div>

      <section aria-labelledby="allegation-heading" className="mt-10">
        <SectionHeading>
          <span id="allegation-heading">{obligationHeading}</span>
        </SectionHeading>

        <div className="mt-3 max-w-[62ch]">
          {obligation.length > 0 ? (
            obligation.map((paragraph, index) => (
              <p key={index} className="text-base text-ink [&:not(:first-child)]:mt-3">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-base text-ink-muted">
              Nothing has been read off this document yet.
            </p>
          )}
        </div>
      </section>

      <Consequence steps={consequence} />
    </div>
  );
}
