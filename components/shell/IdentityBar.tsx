import Link from "next/link";
import { BUSINESS } from "@/components/lib/identity";
import { auth, signOut, AUTH_ENABLED } from "@/auth";
import { ResetButton } from "./ResetButton";

async function AccountControl() {
  if (!AUTH_ENABLED) return null;

  const session = await auth();
  if (!session?.user) return null;

  const who = session.user.email ?? session.user.name ?? "signed in";

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/sign-in" });
      }}
      className="flex items-center gap-3"
    >
      <span className="hidden max-w-[24ch] truncate text-xs text-ink-faint md:block">
        {who}
      </span>
      <button
        type="submit"
        className="rounded-md border border-rule px-3 py-1.5 text-xs font-semibold text-ink transition-colors duration-150 ease-[var(--ease-out)] hover:border-ink hover:bg-paper-sunk focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:bg-rule"
      >
        Sign out
      </button>
    </form>
  );
}

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

      <div className="ml-auto flex items-center gap-3">
        <AccountControl />
        <ResetButton />
      </div>
    </header>
  );
}
