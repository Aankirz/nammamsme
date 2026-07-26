import type { Fact } from "@/components/lib/facts";
import type { BlockKey } from "@/components/lib/source";
import { TONE_TEXT_CLASSES } from "@/components/lib/urgency";
import { Money } from "@/components/ui/Money";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { FactCell, FactStrip } from "./FactCell";

const DISPLAY = "font-[family-name:var(--font-heading)] font-semibold";

const SIZE: Record<Fact["variant"], string> = {
  money: `${DISPLAY} text-[26px] leading-[1.05]`,
  date: `${DISPLAY} text-[30px] leading-[1.02]`,
  text: `${DISPLAY} text-[26px] leading-[1.05]`,
};

function Value({ fact }: { fact: Fact }) {
  if (fact.variant === "money" && fact.amount !== null) {
    return <Money amount={fact.amount} size="hero" />;
  }

  return <span className={`numerals ${SIZE[fact.variant]}`}>{fact.value}</span>;
}

interface TracedFactsProps {
  facts: readonly Fact[];
  active: BlockKey | null;
  onSelect: (key: BlockKey) => void;
  traceable: boolean;
}

export function TracedFacts({ facts, active, onSelect, traceable }: TracedFactsProps) {
  return (
    <FactStrip>
      {facts.map((fact) => {
        const key = fact.blockKey;
        const canTrace = traceable && key !== null;
        const isActive = canTrace && key === active;

        return (
          <FactCell
            key={fact.id}
            label={fact.label}
            note={canTrace && !fact.note ? "Select it to see where it came from" : fact.note}
            noteClassName={fact.tone ? TONE_TEXT_CLASSES[fact.tone] : "opacity-50"}
            aside={<SpeakButton text={fact.speech} label={fact.speechLabel} />}
          >
            {canTrace ? (
              <button
                type="button"
                data-active={isActive}
                aria-pressed={isActive}
                onClick={() => onSelect(key)}
                className={`block cursor-pointer border-b-2 border-[var(--color-accent)] text-left ${
                  isActive ? "border-solid" : "border-dotted hover:border-solid"
                }`}
              >
                <Value fact={fact} />
                <span className="sr-only"> Show where this came from on the page</span>
              </button>
            ) : (
              <Value fact={fact} />
            )}
          </FactCell>
        );
      })}
    </FactStrip>
  );
}
