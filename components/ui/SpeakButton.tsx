"use client";

interface SpeakButtonProps {
  /** The sentence that should eventually be spoken. */
  text: string;
  /** Hindi label for screen readers, e.g. "रक़म सुनें". */
  label: string;
}

/**
 * STUB. Read-aloud is owned by the TTS workstream (decision D-19: the three
 * summary cards only). This renders the control, keeps it keyboard-reachable
 * and gives it press feedback; wiring `text` to Sarvam TTS is the remaining
 * work and belongs in an `onSpeak` handler here.
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
      className="press-on-tap grid size-11 shrink-0 place-items-center rounded-full border border-rule-strong bg-paper text-ink-soft transition-colors hover:bg-paper-sunk active:bg-paper-sunk"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
        <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
        <path d="M18.5 6.8a7 7 0 0 1 0 10.4" />
      </svg>
    </button>
  );
}
