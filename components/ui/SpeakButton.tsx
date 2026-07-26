"use client";

import { useEffect, useRef, useState } from "react";

interface SpeakButtonProps {
  text: string;
  label: string;
}

type State = "idle" | "loading" | "playing" | "failed";

export function SpeakButton({ text, label }: SpeakButtonProps) {
  const [state, setState] = useState<State>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function speak() {
    if (state === "loading") return;

    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("idle");
      return;
    }

    setState("loading");

    try {
      let src = cacheRef.current;

      if (!src) {
        const response = await fetch("/api/speak", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error(String(response.status));

        const payload: { audio?: string; mimeType?: string } = await response.json();
        if (!payload.audio) throw new Error("no audio");

        src = `data:${payload.mimeType ?? "audio/wav"};base64,${payload.audio}`;
        cacheRef.current = src;
      }

      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("failed");
      await audio.play();
      setState("playing");
    } catch {
      setState("failed");
    }
  }

  return (
    <button
      type="button"
      aria-label={state === "playing" ? `Stop reading. ${label}` : label}
      aria-busy={state === "loading"}
      data-speech-text={text}
      onClick={speak}
      className={`grid size-6 shrink-0 place-items-center rounded-sm transition-colors duration-150 ease-[var(--ease-out)] hover:bg-paper-sunk hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:bg-rule ${
        state === "failed" ? "text-stamp" : state === "playing" ? "text-ink" : "text-ink-faint"
      } ${state === "loading" ? "opacity-50" : ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
        {state === "playing" ? (
          <>
            <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
            <path d="M18 7a7 7 0 0 1 0 10" />
          </>
        ) : (
          <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
        )}
      </svg>
    </button>
  );
}
