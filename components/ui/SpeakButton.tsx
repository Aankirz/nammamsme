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
      className={`btn btn-icon btn-ghost size-7 shrink-0 p-0 ${
        state === "failed" ? "text-stamp" : ""
      } ${state === "loading" ? "opacity-50" : ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[15px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" />
        <path d="M16 9a5 5 0 0 1 0 6" />
        <path d="M19.4 18.4a9 9 0 0 0 0-12.8" />
      </svg>
    </button>
  );
}
