import { formatRupees } from "@/components/lib/money";

type MoneySize = "sm" | "md" | "hero";

const SIZE_CLASSES: Record<MoneySize, string> = {
  sm: "text-money-sm",
  md: "text-money",
  hero: "text-money-hero",
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
      className={`numerals block font-semibold tracking-[-0.02em] ${SIZE_CLASSES[size]} ${className}`}
    >
      {formatRupees(amount)}
    </span>
  );
}
