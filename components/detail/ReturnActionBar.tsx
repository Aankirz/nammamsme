"use client";

import { useState } from "react";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/ui/buttons";

interface ReturnActionBarProps {
  form: string;
  filed: boolean;
  alarmed: boolean;
}

type Stage = "idle" | "filing" | "sent" | "flagged";

const NOTE: Record<Stage, string | null> = {
  idle: null,
  filing: "Noted. Filing a return from here is the next thing being built.",
  sent: "Noted. Sending to your CA is the next thing being built.",
  flagged: "Noted. The correction sheet is the next thing being built.",
};

export function ReturnActionBar({ form, filed, alarmed }: ReturnActionBarProps) {
  const [stage, setStage] = useState<Stage>("idle");

  const primaryLabel = filed ? "Send to your CA" : `File this ${form}`;
  const secondaryLabel = filed ? "Something is wrong" : "Send to your CA";
  const note = NOTE[stage];

  return (
    <section
      aria-labelledby="return-action-heading"
      className={`sticky bottom-0 z-10 mt-12 border-t bg-paper-raised px-8 py-5 ${
        alarmed ? "border-stamp-rule" : "border-ink"
      }`}
    >
      <h2 id="return-action-heading" className="sr-only">
        What happens next
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setStage(filed ? "sent" : "filing")}
          className={PRIMARY_BUTTON}
        >
          {primaryLabel}
        </button>

        <button
          type="button"
          onClick={() => setStage(filed ? "flagged" : "sent")}
          className={SECONDARY_BUTTON}
        >
          {secondaryLabel}
        </button>
      </div>

      <p aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm text-ink-muted">
        {note}
      </p>
    </section>
  );
}
