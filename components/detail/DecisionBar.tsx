"use client";

import { useState } from "react";

interface DecisionBarProps {
  /** True when `row.blockers.length > 0`. Filing is off the table. */
  blocked: boolean;
  blockerCount: number;
}

type Acknowledgement = "none" | "confirmed" | "correcting" | "sent-to-ca";

const PRIMARY = "min-h-14 flex-1 rounded-card px-5 text-lead font-bold";
const SECONDARY =
  "min-h-14 flex-1 rounded-card border-2 px-5 text-lead font-bold";

/**
 * The bottom of every document. Two shapes, deliberately the same silhouette
 * so the disabled state reads as a locked version of the working one rather
 * than a different screen.
 *
 * STUB: confirm, correct, file and send-to-CA are acknowledged locally. The
 * filing workstream owns `POST /drc06` (decision D-17) and the correction
 * workstream owns the edit sheet.
 */
export function DecisionBar({ blocked, blockerCount }: DecisionBarProps) {
  const [acknowledgement, setAcknowledgement] =
    useState<Acknowledgement>("none");

  return (
    <section
      aria-labelledby="decision-heading"
      className={`sticky bottom-0 z-10 mt-8 border-t-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm ${
        blocked
          ? "border-danger bg-danger-page/95"
          : "border-ink bg-paper-raised/95"
      }`}
    >
      <h2
        id="decision-heading"
        className={`text-label font-bold ${blocked ? "text-danger" : "text-ink"}`}
      >
        {blocked ? "जब तक जाँच पूरी नहीं होती" : "क्या यह सही है?"}
      </h2>

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={blocked}
          aria-describedby={blocked ? "decision-locked-reason" : undefined}
          onClick={() => setAcknowledgement("confirmed")}
          className={`${PRIMARY} press-on-tap ${
            blocked
              ? "cursor-not-allowed border-2 border-dashed border-danger-rule bg-paper-sunk text-ink-faint opacity-70"
              : "bg-ink text-ink-invert shadow-lift"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {blocked && (
              <svg
                viewBox="0 0 24 24"
                className="size-5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
                <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
              </svg>
            )}
            {blocked ? "दाख़िल करें" : "हाँ, सही है"}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setAcknowledgement(blocked ? "sent-to-ca" : "correcting")
          }
          className={`${SECONDARY} press-on-tap ${
            blocked
              ? "border-danger bg-paper-raised text-danger"
              : "border-ink bg-transparent text-ink"
          }`}
        >
          {blocked ? "अपने CA को भेजें" : "नहीं, सुधारना है"}
        </button>
      </div>

      {blocked && (
        <p
          id="decision-locked-reason"
          className="numerals mt-3 text-label font-semibold text-danger"
        >
          {blockerCount} वजह से दाख़िल करना बंद है
        </p>
      )}

      {acknowledgement !== "none" && (
        <p
          role="status"
          className="mt-3 text-label font-semibold text-ink-soft"
        >
          {acknowledgement === "confirmed" && "पक्का किया गया।"}
          {acknowledgement === "correcting" && "सुधार का पन्ना जल्द आ रहा है।"}
          {acknowledgement === "sent-to-ca" &&
            "आपके CA को भेजने की तैयारी है।"}
        </p>
      )}
    </section>
  );
}
