import type { ReactNode } from "react";

interface SectionHeadingProps {
  children: ReactNode;
  /** Renders as this element. Sections need real heading levels. */
  as?: "h2" | "h3";
  className?: string;
}

/**
 * Section eyebrow. Small caps over a hairline, the way a docket labels a part
 * of a file. It never competes with the figures below it.
 */
export function SectionHeading({
  children,
  as: Tag = "h2",
  className = "",
}: SectionHeadingProps) {
  return (
    <Tag className={`eyebrow border-b border-rule pb-2 ${className}`}>{children}</Tag>
  );
}
