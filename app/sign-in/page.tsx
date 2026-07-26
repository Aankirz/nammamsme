import { redirect } from "next/navigation";
import { auth, signIn, AUTH_ENABLED } from "@/auth";
import { BUSINESS } from "@/components/lib/identity";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  if (!AUTH_ENABLED) redirect("/");

  const session = await auth();
  if (session) redirect(next ?? "/");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="w-full max-w-[42ch]">
        <p className="eyebrow">Case file</p>

        <h1 className="mt-3 text-2xl font-semibold text-ink">
          Sign in to open {BUSINESS.name}.
        </h1>

        <p className="mt-3 text-base text-ink-muted">
          Your paperwork, what each document costs, and when it bites. Nothing is filed
          without you confirming it first.
        </p>

        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: next ?? "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ink-invert transition-opacity duration-150 ease-[var(--ease-out)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:opacity-80"
          >
            Continue with Google
          </button>
        </form>

        <p className="mt-6 border-t border-rule pt-4 text-sm text-ink-faint">
          We read documents you give us. We do not file anything on your behalf until you
          confirm the figures, and we refuse to file at all when a figure cannot be traced
          back to the page it came from.
        </p>
      </div>
    </main>
  );
}
