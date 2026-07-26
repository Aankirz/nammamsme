"use client";

interface SpeakButtonProps {
  /** The sentence that should eventually be spoken. */
  text: string;
  /** What is being read, for screen readers. "Read the amount aloud" */
  label: string;
}

/**
 * STUB. Read-aloud belongs to the TTS workstream (D-19: the summary facts
 * only). This renders the control, keeps it keyboard reachable and gives it a
 * pressed state; wiring `text` to Sarvam TTS is the remaining work.
 *
 * Deliberately low prominence. In Hindi this control carried real weight; in
 * English, for an owner who reads English at a desk, it is an accommodation
 * rather than the main path.
 */
export function SpeakButton({ text, label }: SpeakButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-speech-text={text}
      onClick={() => {
        /* TTS workstream hooks in here. */
      }}
      className="grid size-6 shrink-0 place-items-center rounded-sm text-ink-faint transition-colors duration-150 ease-[var(--ease-out)] hover:bg-paper-sunk hover:text-ink active:bg-rule disabled:opacity-40"
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
        <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
      </svg>
    </button>
  );
}
