"use client";

import type { TracedBlocker } from "@/components/lib/blockers";
import type { BlockKey } from "@/components/lib/source";

interface RefusalPanelProps {
  blockers: readonly TracedBlocker[];
  active: BlockKey | null;
  onSelect: (key: BlockKey) => void;
}

/**
 * The system declining to act on a money decision it cannot ground.
 *
 * This is not an error page. It is the product working: two independent
 * readings did not agree, or a page is missing, so nothing gets filed. It has
 * to read as competence, which is why it states what it found, points at the
 * page, and leaves the file action visible and locked rather than hidden.
 */
export function RefusalPanel({ blockers, active, onSelect }: RefusalPanelProps) {
  return (
    <section
      aria-labelledby="refusal-heading"
      className="mb-10 border border-stamp-rule bg-paper-raised"
    >
      <div aria-hidden="true" className="h-[2px] bg-stamp" />

      <div className="px-6 pb-6 pt-5">
        <p className="numerals inline-flex items-center rounded-sm border border-stamp-rule bg-stamp-tint px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-stamp">
          Refused
        </p>

        <h2 id="refusal-heading" className="mt-4 text-2xl font-semibold text-stamp">
          We will not guess.
        </h2>

        <p className="mt-3 max-w-[54ch] text-base text-ink">
          Some of what this document says could not be established twice over. Until it
          can, nothing is filed on your behalf.
        </p>

        <ul className="mt-6 flex flex-col gap-px bg-rule">
          {blockers.map((blocker, index) => (
            <li key={index} className="bg-paper-raised py-4">
              <p className="text-base font-semibold text-stamp">{blocker.headline}</p>
              <p className="mt-1.5 max-w-[58ch] text-base text-ink">{blocker.detail}</p>

              {blocker.blockKey !== null && (
                <button
                  type="button"
                  data-active={blocker.blockKey === active}
                  aria-pressed={blocker.blockKey === active}
                  onClick={() => onSelect(blocker.blockKey as BlockKey)}
                  className="mt-2.5 rounded-sm border border-rule px-2 py-1 text-xs font-semibold text-ink-muted transition-colors duration-150 ease-[var(--ease-out)] hover:border-ink hover:bg-paper-sunk hover:text-ink active:bg-rule data-[active=true]:border-ink data-[active=true]:bg-paper-sunk data-[active=true]:text-ink"
                >
                  Show it on the page
                </button>
              )}

              {blocker.blockKey === null && blocker.reference && (
                <p className="numerals mt-2 font-mono text-xs text-ink-faint">
                  {blocker.reference}
                </p>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-6 border-t border-stamp-rule pt-4 text-sm text-ink-muted">
          This is a decision, not a malfunction. The system read the page, found what it
          could not stand behind, and stopped there.
        </p>
      </div>
    </section>
  );
}
