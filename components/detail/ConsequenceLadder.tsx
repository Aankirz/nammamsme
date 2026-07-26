import type { ConsequenceStep } from "@/components/lib/consequence";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface ConsequenceLadderProps {
  steps: readonly ConsequenceStep[];
  headingId: string;
  title?: string;
  className?: string;
}

export function ConsequenceLadder({
  steps,
  headingId,
  title = "What happens if you ignore this",
  className = "mt-10",
}: ConsequenceLadderProps) {
  if (steps.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className={className}>
      <SectionHeading>
        <span id={headingId}>{title}</span>
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
