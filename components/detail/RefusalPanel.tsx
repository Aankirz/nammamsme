"use client";

import Link from "next/link";
import type { TracedBlocker } from "@/components/lib/blockers";
import type { BlockKey } from "@/components/lib/source";
import { Kicker } from "@/components/ui/Kicker";

interface RefusalPanelProps {
  blockers: readonly TracedBlocker[];
  active: BlockKey | null;
  onSelect: (key: BlockKey) => void;
  fileLabel: string;
  reason: string;
}

const REASON_ID = "file-blocked-reason";

const FIELD = { backgroundColor: "var(--color-accent-900)", color: "var(--color-bg)" };
const HAIRLINE = "color-mix(in srgb, var(--color-bg) 18%, transparent)";
const REVERSED = {
  color: "var(--color-bg)",
  borderColor: "color-mix(in srgb, var(--color-bg) 32%, transparent)",
};
const ALERT_LIGHT = "color-mix(in srgb, var(--stamp) 45%, var(--stamp-tint))";

function countPhrase(count: number): string {
  if (count === 1) return "One check failed";
  if (count === 2) return "Two checks failed";
  return `${count} checks failed`;
}

export function RefusalPanel({
  blockers,
  active,
  onSelect,
  fileLabel,
  reason,
}: RefusalPanelProps) {
  return (
    <section
      aria-labelledby="refusal-heading"
      className="relative mb-[var(--space-6)] p-[var(--space-8)]"
      style={FIELD}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-0 w-[5px] bg-stamp"
      />

      <div className="flex items-start gap-[var(--space-6)]">
        <svg
          viewBox="0 0 24 24"
          className="mt-1 size-10 flex-none"
          fill="none"
          stroke={ALERT_LIGHT}
          strokeWidth={1.5}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m4.9 4.9 14.2 14.2" />
        </svg>

        <div className="min-w-0 flex-1">
          <Kicker style={{ letterSpacing: "0.18em", opacity: 0.6 }}>Filing blocked</Kicker>

          <h2
            id="refusal-heading"
            className="mt-1 mb-2.5 text-[44px] leading-none font-semibold"
          >
            This will not be filed
          </h2>

          <p className="mb-[var(--space-6)] max-w-[72ch] text-[14.5px] leading-[1.55] opacity-85 [text-wrap:pretty]">
            {countPhrase(blockers.length)}. The system will not guess a number and file
            a reply in your name. A wrong reply costs more than a late one.
          </p>

          <ul
            className="grid gap-px"
            style={{ backgroundColor: HAIRLINE, border: `1px solid ${HAIRLINE}` }}
          >
            {blockers.map((blocker, index) => (
              <li
                key={index}
                className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-3.5 px-[var(--space-6)] py-[var(--space-4)]"
                style={FIELD}
              >
                <span
                  aria-hidden="true"
                  className="text-[15px]"
                  style={{ color: ALERT_LIGHT }}
                >
                  ✕
                </span>

                <div className="min-w-0">
                  <p className="text-sm">{blocker.headline}</p>
                  <p className="text-[11.5px] opacity-55">{blocker.detail}</p>
                </div>

                {blocker.blockKey !== null ? (
                  <button
                    type="button"
                    data-active={blocker.blockKey === active}
                    aria-pressed={blocker.blockKey === active}
                    onClick={() => onSelect(blocker.blockKey as BlockKey)}
                    className="btn text-[11.5px]"
                    style={REVERSED}
                  >
                    Show me on the page
                  </button>
                ) : (
                  <span className="numerals text-[11.5px] opacity-55">
                    {blocker.reference}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-[var(--space-6)] flex flex-wrap items-center gap-[var(--space-3)]">
            <Link href="/doc/new" className="btn btn-primary">
              Add the missing page
            </Link>

            <span className="flex-1" />

            <button
              type="button"
              disabled
              aria-describedby={REASON_ID}
              className="btn"
              style={REVERSED}
            >
              {fileLabel}
            </button>
          </div>

          <p
            id={REASON_ID}
            className="mt-[var(--space-3)] mb-0 text-[11.5px] opacity-75"
          >
            {reason}
          </p>
        </div>
      </div>
    </section>
  );
}
