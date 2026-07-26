import type { Blocker, BlockerKind } from "@/lib/types";

interface RefusalPanelProps {
  blockers: readonly Blocker[];
}

const BLOCKER_HEADING: Record<BlockerKind, string> = {
  amount_disagreement: "रक़म पर दोनों जाँचें अलग निकलीं",
  missing_annexure: "जुड़ा हुआ पन्ना नहीं मिला",
  missing_field: "एक ज़रूरी जानकारी नहीं मिली",
};

function StopMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-[3px] size-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.6 8.6l6.8 6.8" />
    </svg>
  );
}

/**
 * The system declining to act on a money decision it cannot ground.
 *
 * This is not an error page. It is the product working: two independent
 * extractions did not agree, or a page is missing, so nothing gets filed.
 * Decision D-12 — refusal is gated on binary conditions, never a model score.
 */
export function RefusalPanel({ blockers }: RefusalPanelProps) {
  return (
    <section
      aria-labelledby="refusal-heading"
      className="hatch-danger mx-4 mt-5 overflow-hidden rounded-panel border-2 border-danger bg-danger-wash"
    >
      <div className="h-2 bg-danger" aria-hidden="true" />

      <div className="px-5 pb-6 pt-5">
        <p className="inline-flex -rotate-1 items-center rounded-tag border-2 border-danger px-2 py-1 font-mono text-tag font-bold uppercase text-danger">
          रोका गया
        </p>

        <h2
          id="refusal-heading"
          className="mt-4 text-display font-bold leading-tight text-danger"
        >
          हम अंदाज़ा नहीं लगाएंगे
        </h2>

        <p className="mt-3 max-w-[34ch] text-body text-ink">
          इस दस्तावेज़ में कुछ बातें पक्की नहीं हो पाईं। जब तक वे साफ़ नहीं होतीं,
          हम आपकी तरफ़ से कुछ भी दाख़िल नहीं करेंगे।
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {blockers.map((blocker, index) => (
            <li
              key={index}
              className="flex gap-3 rounded-card border border-danger-rule bg-paper-raised px-4 py-4 text-danger"
            >
              <StopMark />
              <div className="min-w-0 flex-1">
                <p className="text-label font-bold uppercase tracking-[0.06em] text-danger">
                  {BLOCKER_HEADING[blocker.kind] ?? "जाँच पूरी नहीं हुई"}
                </p>
                <p className="mt-1 text-body text-ink">{blocker.detail}</p>
                {blocker.sourceRef && (
                  <p className="numerals mt-2 font-mono text-micro text-ink-faint">
                    पन्ना {blocker.sourceRef.page} · हिस्सा{" "}
                    {blocker.sourceRef.block}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-5 border-t border-danger-rule pt-4 text-label font-semibold text-danger">
          यह गड़बड़ी नहीं है। यह हमारा फ़ैसला है।
        </p>
      </div>
    </section>
  );
}
