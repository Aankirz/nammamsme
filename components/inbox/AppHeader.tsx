import { formatHindiDate } from "@/components/lib/hindi";

interface AppHeaderProps {
  today: Date;
}

function isoDate(date: Date): string {
  // Rendered in IST so the masthead date matches the deadline arithmetic.
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function AppHeader({ today }: AppHeaderProps) {
  return (
    <header className="flex items-baseline justify-between gap-4 border-b-2 border-ink px-5 pb-3 pt-5">
      <p className="text-title font-bold tracking-[-0.01em]">कागज़</p>
      <p className="numerals text-micro text-ink-faint">
        {formatHindiDate(isoDate(today))}
      </p>
    </header>
  );
}
