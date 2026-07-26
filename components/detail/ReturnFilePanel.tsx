"use client";

import { useState } from "react";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";

interface ReturnFilePanelProps {
  form: string;
  filed: boolean;
}

type Stage = "idle" | "filing" | "sent";

const NOTE: Record<Stage, string> = {
  idle: "Filing a return runs through the same mock endpoint as the DRC-06 reply.",
  filing: "Noted. Filing a return from here is the next thing being built.",
  sent: "Noted. Sending to your CA is the next thing being built.",
};

export function ReturnFilePanel({ form, filed }: ReturnFilePanelProps) {
  const [stage, setStage] = useState<Stage>("idle");

  return (
    <Blueprint as="section" className="p-[var(--space-6)]">
      <Kicker as="h2" className="mb-[var(--space-4)]">
        What happens next
      </Kicker>

      <button
        type="button"
        onClick={() => setStage(filed ? "sent" : "filing")}
        className="btn btn-primary btn-block"
      >
        {filed ? "Send to my CA" : `File this ${form}`}
      </button>

      {!filed && (
        <button
          type="button"
          onClick={() => setStage("sent")}
          className="btn btn-secondary btn-block"
        >
          Send to my CA
        </button>
      )}

      <p aria-live="polite" className="mt-[var(--space-3)] text-[11.5px] opacity-50">
        {NOTE[stage]}
      </p>
    </Blueprint>
  );
}
