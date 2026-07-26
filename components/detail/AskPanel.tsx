"use client";

import { useEffect, useRef, useState } from "react";
import {
  askFailure,
  askStarters,
  callCountPhrase,
  elapsedPhrase,
  formatArgs,
  readTrace,
  toAskAnswer,
  toolLabel,
  type AskAnswer,
  type TraceStep,
} from "@/components/lib/ask";
import type { DocumentRow } from "@/components/lib/documents";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/ui/buttons";

type Stage = "idle" | "asking" | "answered" | "failed";

const TICK_MS = 1000;
const SKELETON_BARS = ["w-full", "w-[86%]", "w-[54%]"];

const FIELD =
  "w-full rounded-md border border-rule bg-paper px-3 py-2.5 text-base text-ink transition-colors duration-150 ease-[var(--ease-out)] placeholder:text-ink-faint hover:border-rule-strong focus:border-ink disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-ink-faint";

const STARTER =
  "rounded-sm px-1 py-0.5 -mx-1 text-left text-sm text-ink-muted underline decoration-rule-strong decoration-dotted decoration-2 underline-offset-4 transition-colors duration-150 ease-[var(--ease-out)] hover:bg-paper-sunk hover:text-ink hover:decoration-ink active:bg-rule disabled:cursor-not-allowed disabled:opacity-50";

function Trace({ steps }: { steps: readonly TraceStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="mt-3 max-w-[62ch] text-sm text-ink-muted">
        Nothing in your records was read to answer that, so treat the answer as
        general rather than as a fact about this business.
      </p>
    );
  }

  return (
    <ol className="mt-3 border-t border-rule">
      {steps.map((step, index) => {
        const args = formatArgs(step.args);

        return (
          <li key={index} className="flex gap-3 border-b border-rule py-2.5">
            <span className="numerals w-5 shrink-0 pt-px text-right font-mono text-xs text-ink-faint">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-ink">{toolLabel(step.tool)}</p>
              <p className="numerals mt-0.5 overflow-x-auto font-mono text-xs whitespace-nowrap text-ink-faint">
                {step.tool}
                {args && <span className="text-ink-muted">{`  ${args}`}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Pending({ seconds }: { seconds: number }) {
  return (
    <div className="mt-5">
      <p className="numerals font-mono text-xs text-ink-muted">
        Reading your records. {seconds}s
      </p>

      <div className="mt-3 max-w-[62ch] space-y-2">
        {SKELETON_BARS.map((width) => (
          <span key={width} className={`block h-3 rounded-sm bg-paper-sunk ${width}`} />
        ))}
      </div>

      <div className="mt-6 border-t border-rule">
        {[0, 1].map((index) => (
          <div key={index} className="flex gap-3 border-b border-rule py-2.5">
            <span className="block h-3 w-5 shrink-0 rounded-sm bg-paper-sunk" />
            <span className="block h-3 w-52 rounded-sm bg-paper-sunk" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface AskPanelProps {
  row: DocumentRow;
}

export function AskPanel({ row }: AskPanelProps) {
  const [question, setQuestion] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<AskAnswer | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [partial, setPartial] = useState<TraceStep[]>([]);
  const [seconds, setSeconds] = useState(0);
  const field = useRef<HTMLInputElement>(null);

  const asking = stage === "asking";
  const starters = askStarters(row);

  useEffect(() => {
    if (!asking) return;

    const started = Date.now();
    const timer = window.setInterval(() => {
      setSeconds(Math.round((Date.now() - started) / TICK_MS));
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [asking]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (trimmed === "" || asking) return;

    setStage("asking");
    setSeconds(0);
    setResult(null);
    setFailure(null);
    setPartial([]);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const body = (payload ?? {}) as Record<string, unknown>;
        setFailure(askFailure(body.error));
        setPartial(readTrace(body.trace));
        setStage("failed");
        return;
      }

      const parsed = toAskAnswer(payload);
      if (!parsed) {
        setFailure(askFailure(null));
        setStage("failed");
        return;
      }

      setResult(parsed);
      setStage("answered");
    } catch {
      setFailure("The question did not reach the server. Nothing was read.");
      setStage("failed");
    }
  }

  function runStarter(text: string) {
    setQuestion(text);
    field.current?.focus();
    void ask(text);
  }

  return (
    <section aria-labelledby="ask-heading" className="border border-rule bg-paper-raised">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 transition-colors duration-150 ease-[var(--ease-out)] hover:bg-paper-sunk active:bg-rule [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-block font-mono text-xs text-ink-faint transition-transform duration-150 ease-[var(--ease-out)] group-open:rotate-90"
            >
              &rsaquo;
            </span>
            <span id="ask-heading" className="eyebrow">
              Ask about this file
            </span>
          </span>
          <span className="text-sm text-ink-muted">
            Answers from your records, and says which ones
          </span>
        </summary>

        <div className="border-t border-rule px-6 pb-6 pt-5">
          <p className="max-w-[62ch] text-sm text-ink-muted">
            One question at a time. It cannot state a figure that did not come from
            your records, and it lists every record it opened.
          </p>

          <form
            className="mt-4 flex flex-wrap items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(question);
            }}
          >
            <label htmlFor="ask-question" className="sr-only">
              Your question
            </label>
            <input
              ref={field}
              id="ask-question"
              name="question"
              type="text"
              autoComplete="off"
              maxLength={400}
              disabled={asking}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What happens if I do not reply?"
              className={`${FIELD} min-w-0 flex-1 basis-80`}
            />
            <button
              type="submit"
              disabled={asking || question.trim() === ""}
              className={PRIMARY_BUTTON}
            >
              {asking ? "Reading" : "Ask"}
            </button>
            {stage !== "idle" && (
              <button
                type="button"
                disabled={asking}
                onClick={() => {
                  setQuestion("");
                  setResult(null);
                  setFailure(null);
                  setPartial([]);
                  setStage("idle");
                  field.current?.focus();
                }}
                className={SECONDARY_BUTTON}
              >
                Clear
              </button>
            )}
          </form>

          {stage === "idle" && (
            <p className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <span className="text-sm text-ink-faint">Or ask</span>
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => runStarter(starter)}
                  className={STARTER}
                >
                  {starter}
                </button>
              ))}
            </p>
          )}

          <div aria-live="polite" aria-busy={asking}>
            {asking && <Pending seconds={seconds} />}

            {stage === "answered" && result && (
              <div className="mt-5">
                {result.answer.split("\n").map((paragraph, index) =>
                  paragraph.trim() === "" ? null : (
                    <p
                      key={index}
                      className="max-w-[62ch] text-base text-ink [&:not(:first-child)]:mt-3"
                    >
                      {paragraph}
                    </p>
                  ),
                )}

                <div className="mt-6">
                  <h3 className="eyebrow">What it read to answer that</h3>
                  <Trace steps={result.trace} />

                  {result.trace.length > 0 && (
                    <p className="numerals mt-3 max-w-[62ch] font-mono text-xs text-ink-faint">
                      {callCountPhrase(result.trace.length)} in{" "}
                      {elapsedPhrase(result.totalMs)}. Every figure above came from
                      those calls.
                    </p>
                  )}
                </div>
              </div>
            )}

            {stage === "failed" && failure && (
              <div className="mt-5">
                <p className="max-w-[62ch] text-sm text-stamp">{failure}</p>

                {partial.length > 0 && (
                  <div className="mt-5">
                    <h3 className="eyebrow">What it had read before it stopped</h3>
                    <Trace steps={partial} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </details>
    </section>
  );
}
