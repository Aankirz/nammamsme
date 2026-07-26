import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  /** Rule colour, so a section can inherit the tone of what it introduces. */
  ruleClassName?: string;
  className?: string;
}

/**
 * Section eyebrow.
 *
 * Devanagari must never be letter-spaced — tracking pulls matras away from
 * their base glyph and breaks conjuncts. So the "small caps eyebrow" look is
 * built from a rule mark, weight and colour instead of `tracking` + `uppercase`.
 */
export function SectionLabel({
  children,
  ruleClassName = "bg-rule-strong",
  className = "",
}: SectionLabelProps) {
  return (
    <span className={`flex items-center gap-2 text-label font-bold ${className}`}>
      <span
        aria-hidden="true"
        className={`h-[2px] w-4 shrink-0 rounded-full ${ruleClassName}`}
      />
      {children}
    </span>
  );
}
