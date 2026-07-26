import type { CSSProperties, ReactNode } from "react";
import { KICKER } from "@/components/inbox/styles";

type KickerTag = "div" | "span" | "p" | "h2" | "h3";

interface KickerProps {
  children: ReactNode;
  as?: KickerTag;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

export function Kicker({
  children,
  as: Tag = "div",
  id,
  className = "",
  style,
}: KickerProps) {
  return (
    <Tag id={id} style={{ ...KICKER, ...style }} className={className}>
      {children}
    </Tag>
  );
}
