"use client";

import { useEffect, useRef, useState } from "react";
import {
  askContext,
  askFailure,
  askStarters,
  contextNote,
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
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";

type Stage = "idle" | "asking" | "answered" | "failed";

const TICK_MS = 1000;
const SKELETON_BARS = ["w-full", "w-[86%]", "w-[54%]"];
const BAR = "block h-3 bg-[var(--color-surface)]";

function Trace({ steps }: { steps: readonly TraceStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="mt-[var(--space-3)] max-w-[72ch] text-[12.5px] opacity-60">
        Nothing in your records was read to answer that, so treat the answer as general
        rather than as a fact about this business.
      </p>
    );
  }

  return (
    <ol className="mt-[var(--space-3)] border-t border-rule">
      {steps.map((step, index) => {
        const args = formatArgs(step.args);

        return (
          <li
            key={index}
            className="grid grid-cols-[22px_minmax(0,1fr)] items-baseline gap-2.5 border-b border-rule py-2"
          >
            <span className="numerals text-[11px] opacity-45">{index + 1}</span>
            <div className="min-w-0">
              <span className="text-[13.5px]">{toolLabel(step.tool)}</span>{" "}
              <span className="numerals text-[11.5px] opacity-45">
                {step.tool}
                {args && ` ${args}`}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Pending({ seconds }: { seconds: number }) {
  return (
    <div className="mt-[var(--space-6)]">
      <p className="numerals text-[11px] opacity-60">Reading your records. {seconds}s</p>

      <div className="mt-[var(--space-3)] grid max-w-[72ch] gap-2">
        {SKELETON_BARS.map((width) => (
          <span key={width} className={`${BAR} ${width}`} />
        ))}
      </div>

      <div className="mt-[var(--space-6)] border-t border-rule">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="grid grid-cols-[22px_minmax(0,1fr)] items-baseline gap-2.5 border-b border-rule py-2"
          >
            <span className={`${BAR} w-full`} />
            <span className={`${BAR} w-52`} />
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
        body: JSON.stringify({ question: `${trimmed}\n\n${askContext(row)}` }),
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
    <Blueprint as="section" ariaLabelledBy="ask-heading">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-[var(--space-6)] py-[var(--space-4)] [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2.5">
            <svg
              viewBox="0 0 24 24"
              className="size-3.5 opacity-45 transition-transform duration-150 group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
            <Kicker as="h2" id="ask-heading">
              Ask about this file
            </Kicker>
          </span>
          <span className="text-[11px] opacity-45">
            Answers from your records, and says which ones
          </span>
        </summary>

        <div className="border-t border-rule px-[var(--space-6)] pt-[var(--space-6)] pb-[var(--space-6)]">
          <p className="max-w-[72ch] text-[12.5px] opacity-60 [text-wrap:pretty]">
            One question at a time. It cannot state a figure that did not come from your
            records, and it lists every record it opened.
          </p>

          <form
            className="mt-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-3)]"
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
              required
              disabled={asking}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="A question about this document"
              className="input min-w-0 flex-1 basis-80"
            />
            <button type="submit" disabled={asking} className="btn btn-primary">
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
                className="btn btn-secondary"
              >
                Clear
              </button>
            )}
          </form>

          <p className="numerals mt-2 text-[11px] opacity-45">{contextNote(row)}</p>

          {stage === "idle" && (
            <p className="mt-[var(--space-3)] flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[12.5px] opacity-45">Or ask</span>
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => runStarter(starter)}
                  className="btn btn-ghost text-[12.5px]"
                >
                  {starter}
                </button>
              ))}
            </p>
          )}

          <div aria-live="polite" aria-busy={asking}>
            {asking && <Pending seconds={seconds} />}

            {stage === "answered" && result && (
              <div className="mt-[var(--space-6)]">
                {result.answer.split("\n").map((paragraph, index) =>
                  paragraph.trim() === "" ? null : (
                    <p
                      key={index}
                      className="max-w-[72ch] text-[14.5px] leading-[1.6] [&:not(:first-child)]:mt-[var(--space-3)]"
                    >
                      {paragraph}
                    </p>
                  ),
                )}

                <div className="mt-[var(--space-6)]">
                  <Kicker as="h3">What it read to answer that</Kicker>
                  <Trace steps={result.trace} />

                  {result.trace.length > 0 && (
                    <p className="numerals mt-[var(--space-3)] max-w-[72ch] text-[11px] opacity-45">
                      {callCountPhrase(result.trace.length)} in{" "}
                      {elapsedPhrase(result.totalMs)}. Every figure above came from those
                      calls.
                    </p>
                  )}
                </div>
              </div>
            )}

            {stage === "failed" && failure && (
              <div className="mt-[var(--space-6)]">
                <p className="max-w-[72ch] text-[12.5px] text-stamp">{failure}</p>

                {partial.length > 0 && (
                  <div className="mt-[var(--space-6)]">
                    <Kicker as="h3">What it had read before it stopped</Kicker>
                    <Trace steps={partial} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </details>
    </Blueprint>
  );
}
