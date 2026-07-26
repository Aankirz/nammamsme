import type { ReactNode } from "react";
import { Kicker } from "@/components/ui/Kicker";

interface FactStripProps {
  children: ReactNode;
}

export function FactStrip({ children }: FactStripProps) {
  return (
    <div className="grid border border-rule [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
      {children}
    </div>
  );
}

interface FactCellProps {
  label: string;
  note?: string | null;
  noteClassName?: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function FactCell({
  label,
  note,
  noteClassName = "opacity-50",
  aside,
  children,
}: FactCellProps) {
  return (
    <div className="min-w-0 border-r border-rule p-[var(--space-6)] last:border-r-0">
      <div className="flex items-start justify-between gap-2">
        <Kicker>{label}</Kicker>
        {aside}
      </div>

      <div className="mt-2">{children}</div>

      {note && (
        <p className={`numerals mt-1.5 text-[11.5px] ${noteClassName}`}>{note}</p>
      )}
    </div>
  );
}
