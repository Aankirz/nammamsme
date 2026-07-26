"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ResetState = "idle" | "working" | "failed";

const LABEL: Record<ResetState, string> = {
  idle: "Reset demo",
  working: "Resetting",
  failed: "Reset failed, try again",
};

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
      className="btn btn-ghost"
      style={{ fontSize: "12px", whiteSpace: "nowrap" }}
    >
      {busy ? LABEL.working : LABEL[state]}
    </button>
  );
}
