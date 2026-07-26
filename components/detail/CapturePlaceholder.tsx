"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Hop {
  step: string;
  elapsedMs: number;
}

type Phase = "idle" | "working" | "failed";

const ACCEPT = ".pdf,.png,.jpg,.jpeg";

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function CapturePlaceholder() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [filename, setFilename] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hops, setHops] = useState<Hop[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "working") return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - started), 100);
    return () => clearInterval(timer);
  }, [phase]);

  async function send(file: File) {
    setPhase("working");
    setFilename(file.name);
    setError(null);
    setHops([]);
    setElapsed(0);

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch("/api/process", { method: "POST", body });
      const payload = await response.json();

      if (!response.ok) {
        setHops(payload.hops ?? []);
        setError(payload.detail ?? payload.error ?? "The page could not be read.");
        setPhase("failed");
        return;
      }

      setHops(payload.hops ?? []);
      router.push(`/doc/${payload.document.id}`);
      router.refresh();
    } catch {
      setError("The request did not complete. Check the connection and try again.");
      setPhase("failed");
    }
  }

  return (
    <div className="w-full max-w-[var(--content-max)] px-8 pb-16 pt-12">
      <p className="eyebrow">Add a document</p>

      <h1 className="mt-3 max-w-[26ch] text-2xl font-semibold text-ink">
        {phase === "working" ? "Reading the page." : "Put a document in."}
      </h1>

      {phase !== "working" && (
        <p className="mt-3 max-w-[58ch] text-base text-ink-muted">
          A notice, invoice or licence, as a photograph or a PDF. A creased or badly lit
          page is fine. Ten pages at most.
        </p>
      )}

      {phase === "working" && (
        <p className="mt-3 max-w-[58ch] text-base text-ink-muted">
          {filename}. This usually takes between fifteen and seventy seconds, most of it
          waiting on the page to be read.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void send(file);
        }}
      />

      {phase !== "working" && (
        <p className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-invert transition-opacity duration-150 ease-[var(--ease-out)] hover:opacity-90 active:opacity-80"
          >
            Choose a document
          </button>
          <Link
            href="/"
            className="inline-block rounded-md border border-rule px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 ease-[var(--ease-out)] hover:border-ink hover:bg-paper-sunk active:bg-rule"
          >
            Back to the file
          </Link>
        </p>
      )}

      {phase === "working" && (
        <p className="numerals mt-8 font-mono text-4xl tabular-nums text-ink">
          {seconds(elapsed)}
        </p>
      )}

      {hops.length > 0 && (
        <ol className="mt-8 max-w-[58ch] border-t border-rule">
          {hops.map((hop) => (
            <li key={hop.step} className="flex justify-between gap-4 border-b border-rule py-2.5">
              <span className="text-base text-ink">{hop.step}</span>
              <span className="numerals font-mono text-sm tabular-nums text-ink-faint">
                {seconds(hop.elapsedMs)}
              </span>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <div className="mt-8 max-w-[58ch] border border-stamp-rule bg-stamp-tint p-4">
          <p className="text-sm font-semibold text-stamp">The document was not read.</p>
          <p className="mt-1 text-sm text-ink">{error}</p>
        </div>
      )}
    </div>
  );
}
