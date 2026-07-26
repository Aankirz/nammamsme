"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { blockedReason } from "@/components/lib/blockers";
import { ReplyPreview } from "./ReplyPreview";

interface ActionBarProps {
  documentId: string;
  /** Only a GST notice has a filing path (D-03). */
  canFile: boolean;
  blocked: boolean;
  blockerCount: number;
  /** The ARN, once this document has been filed. */
  filedRef: string | null;
}

type Stage = "idle" | "reviewing" | "filing" | "filed" | "failed" | "flagged" | "sent";

const PRIMARY =
  "rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-invert transition-[opacity,transform] duration-150 ease-[var(--ease-out)] hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-rule-strong disabled:bg-paper-sunk disabled:text-ink-faint disabled:opacity-100 disabled:hover:opacity-100";

const SECONDARY =
  "rounded-md border border-rule px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 ease-[var(--ease-out)] hover:border-ink hover:bg-paper-sunk active:bg-rule disabled:cursor-not-allowed disabled:opacity-50";

const REASON_ID = "file-blocked-reason";

/**
 * The bottom of every document. No view ends in a noun.
 *
 * When the system has refused, the file action does not disappear. It stays
 * where it was, locked, with the reason attached to it, so the owner can see
 * exactly what is standing between this document and a filed reply.
 *
 * STUB: "Something is wrong" and "Send to your CA" acknowledge locally. The
 * correction sheet and the CA hand-off belong to other workstreams. Filing
 * itself is real, against the mock portal route (D-17).
 */
export function ActionBar({
  documentId,
  canFile,
  blocked,
  blockerCount,
  filedRef,
}: ActionBarProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [arn, setArn] = useState<string | null>(filedRef);
  const [, startTransition] = useTransition();

  const alreadyFiled = arn !== null || stage === "filed";
  const primaryLabel = canFile ? "Confirm and file reply" : "Send to your CA";
  const primaryDisabled = (blocked && canFile) || alreadyFiled;
  const secondaryLabel = blocked && canFile ? "Send to your CA" : "Something is wrong";

  const reason = blocked
    ? blockedReason(blockerCount)
    : alreadyFiled
      ? "This document has already been filed."
      : null;

  async function file() {
    setStage("filing");

    try {
      const response = await fetch("/api/drc06", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (!response.ok) throw new Error(String(response.status));

      const payload: unknown = await response.json();
      const reference =
        typeof payload === "object" && payload !== null
          ? (payload as { arn?: unknown }).arn
          : null;

      setArn(typeof reference === "string" ? reference : null);
      setStage("filed");
      startTransition(() => router.refresh());
    } catch {
      setStage("failed");
    }
  }

  function onPrimary() {
    if (!canFile) {
      setStage("sent");
      return;
    }
    setStage("reviewing");
  }

  return (
    <section
      aria-labelledby="action-heading"
      className={`sticky bottom-0 z-10 mt-12 border-t bg-paper-raised px-8 py-5 ${
        blocked ? "border-stamp-rule" : "border-ink"
      }`}
    >
      <h2 id="action-heading" className="sr-only">
        What happens next
      </h2>

      {stage === "reviewing" || stage === "filing" ? (
        <ReplyPreview
          filing={stage === "filing"}
          onFile={file}
          onCancel={() => setStage("idle")}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            aria-describedby={reason ? REASON_ID : undefined}
            className={PRIMARY}
          >
            {primaryLabel}
          </button>

          <button
            type="button"
            onClick={() => setStage(secondaryLabel === "Send to your CA" ? "sent" : "flagged")}
            className={SECONDARY}
          >
            {secondaryLabel}
          </button>

          {stage === "failed" && (
            <button type="button" onClick={file} className={SECONDARY}>
              Try again
            </button>
          )}
        </div>
      )}

      {reason && (
        <p id={REASON_ID} className="mt-3 text-sm text-ink-muted">
          {reason}
        </p>
      )}

      <p aria-live="polite" className="mt-3 text-sm">
        {alreadyFiled && arn !== null && (
          <span className="text-ink">
            Filed. Reference{" "}
            <span className="numerals font-mono font-semibold">{arn}</span>. Keep it for
            your CA.
          </span>
        )}
        {stage === "filed" && arn === null && (
          <span className="text-ink">Filed. The portal returned no reference number.</span>
        )}
        {stage === "failed" && (
          <span className="text-stamp">
            The portal did not accept the reply. Nothing was filed.
          </span>
        )}
        {stage === "flagged" && (
          <span className="text-ink-muted">
            Noted. The correction sheet is the next thing being built.
          </span>
        )}
        {stage === "sent" && (
          <span className="text-ink-muted">
            Noted. Sending to your CA is the next thing being built.
          </span>
        )}
      </p>
    </section>
  );
}
