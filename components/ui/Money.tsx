import { formatRupees } from "@/components/lib/money";

type MoneySize = "sm" | "md" | "lg" | "hero";

const SIZE_CLASSES: Record<MoneySize, string> = {
  sm: "text-[12.5px]",
  md: "text-[15px]",
  lg: "font-[family-name:var(--font-heading)] text-[26px] leading-[1.05]",
  hero: "font-[family-name:var(--font-heading)] text-[44px] leading-[0.95]",
};

interface MoneyProps {
  amount: number | null;
  size?: MoneySize;
  className?: string;
}

export function Money({ amount, size = "md", className = "" }: MoneyProps) {
  return (
    <span className={`numerals font-semibold ${SIZE_CLASSES[size]} ${className}`}>
      {formatRupees(amount)}
    </span>
  );
}
