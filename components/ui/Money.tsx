import { formatRupees } from "@/components/lib/money";

type MoneySize = "sm" | "md" | "lg" | "hero";

/** Fixed steps. Money never uses a fluid size and never wraps. */
const SIZE_CLASSES: Record<MoneySize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  hero: "text-hero",
};

interface MoneyProps {
  amount: number | null;
  size?: MoneySize;
  className?: string;
}

/** Money is the hero on every surface: tabular, unwrapped, tightly tracked. */
export function Money({ amount, size = "md", className = "" }: MoneyProps) {
  return (
    <span
      className={`numerals font-mono font-semibold tracking-[-0.02em] ${SIZE_CLASSES[size]} ${className}`}
    >
      {formatRupees(amount)}
    </span>
  );
}
