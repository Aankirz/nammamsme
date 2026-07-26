import { parseConsequence } from "@/components/lib/consequence";

interface ConsequenceLadderProps {
  /** `consequence` — what happens, in order, if he does nothing. */
  text: string;
}

/** Later rungs are worse. The colour walks down with them. */
const RUNG_TONES = [
  { dot: "bg-warn text-ink-invert", text: "text-ink" },
  { dot: "bg-warn text-ink-invert", text: "text-ink" },
  { dot: "bg-danger text-ink-invert", text: "text-ink" },
  { dot: "bg-danger text-ink-invert", text: "text-danger" },
];

function toneFor(index: number, total: number) {
  if (total <= 1) return RUNG_TONES[2];
  const position = Math.round((index / (total - 1)) * (RUNG_TONES.length - 1));
  return RUNG_TONES[position];
}

/** अगर आप कुछ नहीं करते — the dated ladder down to a frozen bank account. */
export function ConsequenceLadder({ text }: ConsequenceLadderProps) {
  const steps = parseConsequence(text);

  if (steps.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="consequence-heading" className="px-4 pt-8">
      <h2
        id="consequence-heading"
        className="text-label font-semibold uppercase tracking-[0.1em] text-ink-faint"
      >
        अगर आप कुछ नहीं करते
      </h2>

      {steps.length === 1 ? (
        <p className="mt-2 rounded-card border border-danger-rule bg-danger-wash px-4 py-4 text-body text-ink">
          {steps[0].when ? `${steps[0].when} — ` : ""}
          {steps[0].text}
        </p>
      ) : (
        <ol className="relative mt-3 flex flex-col gap-5 pl-1">
          <span
            className="absolute bottom-4 left-[15px] top-4 w-[2px] bg-gradient-to-b from-warn to-danger"
            aria-hidden="true"
          />
          {steps.map((step, index) => {
            const tone = toneFor(index, steps.length);

            return (
              <li key={index} className="relative flex gap-4">
                <span
                  className={`numerals z-10 grid size-8 shrink-0 place-items-center rounded-full text-label font-bold ${tone.dot}`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 pt-[2px]">
                  {step.when && (
                    <span className="numerals block text-label font-bold uppercase tracking-[0.06em] text-ink-faint">
                      {step.when}
                    </span>
                  )}
                  <span className={`block text-body ${tone.text}`}>
                    {step.text}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
