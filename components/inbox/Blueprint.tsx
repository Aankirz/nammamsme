import type { CSSProperties, ReactNode } from "react";

type BlueprintTag = "div" | "section" | "table";

interface BlueprintProps {
  as?: BlueprintTag;
  className?: string;
  style?: CSSProperties;
  ariaLabelledBy?: string;
  children: ReactNode;
}

export function Blueprint({
  as: Tag = "div",
  className,
  style,
  ariaLabelledBy,
  children,
}: BlueprintProps) {
  return (
    <Tag
      className={className ? `blueprint ${className}` : "blueprint"}
      style={style}
      aria-labelledby={ariaLabelledBy}
    >
      <i className="corner tl" aria-hidden="true" />
      <i className="corner tr" aria-hidden="true" />
      <i className="corner bl" aria-hidden="true" />
      <i className="corner br" aria-hidden="true" />
      {children}
    </Tag>
  );
}
