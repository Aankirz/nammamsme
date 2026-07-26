"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";

interface Hop {
  step: string;
  elapsedMs: number;
}

type Phase = "idle" | "working" | "failed";

const ACCEPT = ".pdf,.png,.jpg,.jpeg";

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function CameraMark() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function CapturePlaceholder() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [filename, setFilename] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hops, setHops] = useState<Hop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (phase !== "working") return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - started), 100);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function send(file: File) {
    setPhase("working");
    setFilename(`${file.name} · ${(file.size / 1048576).toFixed(1)} MB`);
    setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
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

  if (phase === "working") {
    return (
      <div className="mx-auto w-full max-w-[1040px] px-[var(--space-6)] pt-[var(--space-8)] pb-16">
        <h1 className="m-0 text-[32px] font-semibold">Reading the document</h1>
        <p className="mt-1 mb-[var(--space-8)] text-[13.5px] opacity-60">
          Every step is timestamped, so the speed can be checked rather than believed.
        </p>

        <div className="grid items-start gap-[var(--space-8)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <Blueprint className="p-[var(--space-2)]">
            <div
              className="relative h-[340px] overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              {preview ? (
                <span
                  aria-hidden="true"
                  className="block size-full bg-cover bg-top opacity-90"
                  style={{ backgroundImage: `url(${preview})` }}
                />
              ) : (
                <span className="grid size-full place-items-center text-[11px] opacity-45">
                  No preview for this file type
                </span>
              )}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-[var(--color-accent)]"
              />
            </div>
            <Kicker style={{ marginTop: "7px", opacity: 0.45 }}>{filename}</Kicker>
          </Blueprint>

          <Blueprint className="p-[var(--space-6)]">
            <ol>
              {hops.map((hop) => (
                <li
                  key={hop.step}
                  className="grid grid-cols-[66px_16px_minmax(0,1fr)] items-baseline gap-2.5 border-b border-rule py-2"
                >
                  <span className="numerals text-[11px] opacity-50">
                    {seconds(hop.elapsedMs)}
                  </span>
                  <span aria-hidden="true" className="text-[13px] text-[var(--color-accent-700)]">
                    ✓
                  </span>
                  <span className="text-[13.5px]">{hop.step}</span>
                </li>
              ))}

              <li className="grid grid-cols-[66px_16px_minmax(0,1fr)] items-baseline gap-2.5 py-2">
                <span className="numerals text-[11px] opacity-50">{seconds(elapsed)}</span>
                <span aria-hidden="true" className="text-[13px] text-[var(--color-accent-700)]">
                  ·
                </span>
                <span className="text-[13.5px] opacity-60">
                  Reading the page. Fifteen to seventy seconds is normal.
                </span>
              </li>
            </ol>
          </Blueprint>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-[var(--space-6)] pt-[var(--space-8)] pb-16">
      <p className="mb-[var(--space-6)]">
        <Link href="/" className="btn btn-ghost text-[12px]">
          &larr; Inbox
        </Link>
      </p>

      <h1 className="m-0 text-[32px] font-semibold">Take a photo of the document</h1>
      <p className="mt-1 mb-[var(--space-8)] max-w-[60ch] text-[13.5px] opacity-60 [text-wrap:pretty]">
        A crumpled, badly lit photo is fine. You do not need to say what kind of
        document it is, the system works that out. Ten pages at most.
      </p>

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

      <Blueprint
        className="mb-[var(--space-8)]"
        style={{
          borderStyle: "dashed",
          borderColor: dragging ? "var(--color-accent)" : "var(--color-neutral-400)",
        }}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void send(file);
          }}
          className="flex w-full cursor-pointer flex-col items-center gap-[var(--space-3)] p-[var(--space-8)]"
        >
          <CameraMark />
          <span className="text-[13px] opacity-60">
            Open the camera, or drop a file here
          </span>
          <Kicker style={{ letterSpacing: "0.14em", opacity: 0.35 }}>
            Photograph or PDF · up to ten pages
          </Kicker>
        </button>
      </Blueprint>

      <p className="flex flex-wrap items-center gap-[var(--space-3)]">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn btn-primary"
        >
          Choose a document
        </button>
        <Link href="/" className="btn btn-secondary">
          Back to the file
        </Link>
      </p>

      {hops.length > 0 && (
        <div className="mt-[var(--space-8)] max-w-[60ch]">
          <Kicker as="h2" className="mb-[var(--space-3)]">
            What it managed before it stopped
          </Kicker>
          <Blueprint className="p-[var(--space-6)]">
            <ol>
              {hops.map((hop) => (
                <li
                  key={hop.step}
                  className="grid grid-cols-[66px_minmax(0,1fr)] items-baseline gap-2.5 border-b border-rule py-2 last:border-b-0"
                >
                  <span className="numerals text-[11px] opacity-50">
                    {seconds(hop.elapsedMs)}
                  </span>
                  <span className="text-[13.5px]">{hop.step}</span>
                </li>
              ))}
            </ol>
          </Blueprint>
        </div>
      )}

      {error && (
        <div className="mt-[var(--space-8)] max-w-[60ch] border border-stamp p-[var(--space-4)]">
          <p className="text-[13px] font-semibold text-stamp">
            The document was not read
          </p>
          <p className="mt-1 text-[12.5px]">{error}</p>
        </div>
      )}
    </div>
  );
}
