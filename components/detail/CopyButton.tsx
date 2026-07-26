"use client";

import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

interface CopyButtonProps {
  text: string;
  label?: string;
  done?: string;
  className?: string;
}

const RESET_MS = 1900;

const DEFAULT_CLASS = "btn btn-secondary flex-none text-[11.5px]";

export function CopyButton({
  text,
  label = "Copy",
  done = "Copied",
  className = DEFAULT_CLASS,
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), RESET_MS);
  }

  return (
    <>
      <button type="button" onClick={copy} className={className}>
        {state === "copied" && <span aria-hidden="true">✓</span>}
        {state === "copied" ? done : state === "failed" ? "Select it and copy" : label}
      </button>

      <span aria-live="polite" className="sr-only">
        {state === "copied"
          ? `${done}.`
          : state === "failed"
            ? "This browser blocked the clipboard. Select the text and copy it by hand."
            : ""}
      </span>
    </>
  );
}
