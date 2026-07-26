import type { ReactNode } from "react";
import { SpeakButton } from "@/components/ui/SpeakButton";

interface FactCardProps {
  /** "कितना" / "कब तक" / "किसने भेजा" */
  question: string;
  /** The fact itself, already formatted. */
  children: ReactNode;
  /** Smaller line under the fact — days remaining, date, GSTIN. */
  footnote?: string | null;
  /** Sentence handed to TTS once that workstream lands. */
  speech: string;
  speechLabel: string;
  accentClassName?: string;
}

/**
 * One of the three facts a trader needs before he can act. Large enough to
 * read at arm's length; the speaker sits beside it, not inside the text.
 */
export function FactCard({
  question,
  children,
  footnote,
  speech,
  speechLabel,
  accentClassName = "bg-rule-strong",
}: FactCardProps) {
  return (
    <li className="relative overflow-hidden rounded-card border border-rule bg-paper-raised shadow-card">
      <span
        className={`absolute inset-y-0 left-0 w-[5px] ${accentClassName}`}
        aria-hidden="true"
      />
      <div className="flex items-start gap-3 py-4 pl-5 pr-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-label font-bold text-ink-faint">
            {question}
          </h3>
          <div className="mt-1">{children}</div>
          {footnote && (
            <p className="numerals mt-1 text-label font-medium text-ink-soft">
              {footnote}
            </p>
          )}
        </div>
        <SpeakButton text={speech} label={speechLabel} />
      </div>
    </li>
  );
}
