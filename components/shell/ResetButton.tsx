"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ResetState = "idle" | "working" | "failed";

const LABEL: Record<ResetState, string> = {
  idle: "Reset",
  working: "Resetting",
  failed: "Reset failed, try again",
};

/**
 * Drops everything the session produced and reseeds. D-07: judges run the demo
 * more than once and the second run must start where the first did.
 *
 * Returns to the rail afterwards, because the document that was open may no
 * longer exist.
 */
export function ResetButton() {
  const router = useRouter();
  const [state, setState] = useState<ResetState>("idle");
  const [isPending, startTransition] = useTransition();

  const busy = state === "working" || isPending;

  async function reset() {
    setState("working");

    try {
      const response = await fetch("/api/reset", { method: "POST" });
      if (!response.ok) throw new Error(String(response.status));

      setState("idle");
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch {
      setState("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={reset}
      disabled={busy}
      className="rounded-sm border border-rule px-2.5 py-1 text-xs font-semibold text-ink-muted transition-colors duration-150 ease-[var(--ease-out)] hover:border-rule-strong hover:bg-paper-sunk hover:text-ink active:bg-rule disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? LABEL.working : LABEL[state]}
    </button>
  );
}
