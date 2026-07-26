import { CHIP_CLASSES, type UrgencyChipModel } from "@/components/lib/urgency";

interface UrgencyChipProps {
  chip: UrgencyChipModel;
  className?: string;
}

const BAR_COUNT = 3;

/**
 * Deadline pressure, twice over: a colour and a three-bar meter. Both are
 * readable at arm's length without parsing the number.
 */
export function UrgencyChip({ chip, className = "" }: UrgencyChipProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-chip border px-3 py-2 text-label font-semibold ${CHIP_CLASSES[chip.tone]} ${className}`}
    >
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {Array.from({ length: BAR_COUNT }, (_, index) => (
          <span
            key={index}
            className="w-[3px] rounded-full bg-current"
            style={{
              height: `${5 + index * 3}px`,
              opacity: index < chip.level ? 1 : 0.22,
            }}
          />
        ))}
      </span>
      <span className="numerals">{chip.text}</span>
    </span>
  );
}
