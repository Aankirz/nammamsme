import type { CSSProperties } from "react";

export const PAGE: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "var(--space-8) var(--space-6) 64px",
};

export const KICKER: CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  opacity: 0.5,
};

export const ASIDE: CSSProperties = {
  fontSize: "11px",
  opacity: 0.45,
};

export const NOTE: CSSProperties = {
  fontSize: "12px",
  opacity: 0.55,
};

export const HEADING: CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 600,
};

export const LEAD: CSSProperties = {
  ...HEADING,
  fontSize: "clamp(34px, 3.8vw, 54px)",
  lineHeight: 0.96,
  letterSpacing: "-0.005em",
  margin: 0,
};

export const SECOND_FIGURE: CSSProperties = {
  ...HEADING,
  fontSize: "26px",
  lineHeight: 1.05,
  fontVariantNumeric: "tabular-nums",
};

export const QUIET_FIGURE: CSSProperties = {
  ...HEADING,
  fontSize: "21px",
  lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
};

export const BODY: CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.55,
};

export const SECTION_BAR: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "var(--space-4)",
  marginBottom: "var(--space-3)",
};

export const CELL: CSSProperties = {
  padding: "var(--space-6)",
};

export const DIVIDER = "1px solid var(--color-divider)";

export const TAG_SMALL: CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.08em",
};

export const MARK: CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  opacity: 0.45,
};

export const NUMERIC: CSSProperties = {
  fontVariantNumeric: "tabular-nums",
};
