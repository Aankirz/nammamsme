import type { ReturnFact } from "@/components/lib/returns";
import { TONE_TEXT_CLASSES } from "@/components/lib/urgency";
import { Money } from "@/components/ui/Money";
import { FactCell, FactStrip } from "./FactCell";

interface ReturnFactsProps {
  facts: readonly ReturnFact[];
}

const DISPLAY = "numerals font-[family-name:var(--font-heading)] font-semibold";

function Value({ fact }: { fact: ReturnFact }) {
  if (fact.variant === "money" && fact.amount !== null) {
    return (
      <Money
        amount={fact.amount}
        size="hero"
        className={fact.tone === "stamp" ? "text-stamp" : ""}
      />
    );
  }

  if (fact.variant === "reference") {
    return <span className={`${DISPLAY} text-[26px] leading-[1.05]`}>{fact.value}</span>;
  }

  return <span className={`${DISPLAY} text-[30px] leading-[1.02]`}>{fact.value}</span>;
}

export function ReturnFacts({ facts }: ReturnFactsProps) {
  return (
    <FactStrip>
      {facts.map((fact) => (
        <FactCell
          key={fact.id}
          label={fact.label}
          note={fact.note}
          noteClassName={fact.tone ? TONE_TEXT_CLASSES[fact.tone] : "opacity-50"}
        >
          <Value fact={fact} />
        </FactCell>
      ))}
    </FactStrip>
  );
}
