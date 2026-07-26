import type { ConsequenceStep } from "@/components/lib/consequence";
import { Kicker } from "@/components/ui/Kicker";
import { inRupees } from "@/components/lib/money";

interface ConsequenceLadderProps {
  steps: readonly ConsequenceStep[];
  headingId: string;
  title?: string;
  className?: string;
}

function dotClass(index: number, total: number): string {
  if (index === 0) return "bg-[var(--color-accent)]";
  if (index === total - 1) return "bg-stamp";
  return "border border-stamp";
}

export function ConsequenceLadder({
  steps,
  headingId,
  title = "If you do nothing",
  className = "",
}: ConsequenceLadderProps) {
  if (steps.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className={className}>
      <Kicker as="h2" id={headingId} className="mb-[var(--space-3)]">
        {title}
      </Kicker>

      <ol className="border border-rule">
        {steps.map((step, index) => (
          <li
            key={index}
            className="grid grid-cols-[120px_22px_minmax(0,1fr)] items-center gap-[var(--space-4)] border-b border-rule px-[var(--space-6)] py-[var(--space-4)] last:border-b-0"
          >
            <span className="numerals text-[12.5px] opacity-70">{step.when ?? ""}</span>

            <span
              aria-hidden="true"
              className={`inline-block size-[9px] ${dotClass(index, steps.length)}`}
            />

            <p className="text-[14.5px] [text-wrap:pretty]">{inRupees(step.text)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
