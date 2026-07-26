import { TONE_TEXT_CLASSES, type Tone } from "@/components/lib/urgency";

interface DayCountProps {
  text: string;
  tone: Tone;
  className?: string;
}

/**
 * The day-count. Mono, small, tabular. It carries the state colour, and the
 * 2px rule above the row carries the same signal for anyone reading the screen
 * at a glance rather than word by word.
 */
export function DayCount({ text, tone, className = "" }: DayCountProps) {
  return (
    <span
      className={`numerals font-mono text-xs font-semibold ${TONE_TEXT_CLASSES[tone]} ${className}`}
    >
      {text}
    </span>
  );
}
