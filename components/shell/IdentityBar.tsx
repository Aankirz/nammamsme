import Link from "next/link";
import { BUSINESS } from "@/components/lib/identity";
import { ResetButton } from "./ResetButton";

/**
 * Whose file this is. One line across the top, the way a matter file is
 * labelled. It never announces the product and never greets anybody.
 */
export function IdentityBar() {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--identity-height)] items-center gap-4 border-b border-rule bg-paper-raised px-6">
      <Link
        href="/"
        className="rounded-sm text-base font-semibold text-ink transition-opacity duration-150 ease-[var(--ease-out)] hover:opacity-70"
      >
        {BUSINESS.name}
      </Link>

      <span aria-hidden="true" className="h-4 w-px bg-rule" />

      <p className="numerals font-mono text-xs text-ink-faint">
        <span className="sr-only">GSTIN </span>
        {BUSINESS.gstin}
      </p>

      <p className="hidden text-xs text-ink-faint sm:block">{BUSINESS.place}</p>

      <div className="ml-auto">
        <ResetButton />
      </div>
    </header>
  );
}
