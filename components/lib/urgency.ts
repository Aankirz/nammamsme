/**
 * Urgency is a colour and a shape, not a number. A trader should be able to
 * scan the inbox with the numbers blurred and still know what is on fire.
 */

import type { ObligationRow } from "@/lib/types";
import { agePhrase, deadlinePhrase, expiryPhrase } from "./hindi";
import { daysSince, daysUntil } from "./dates";

/** Days at which an obligation turns red. */
export const CRITICAL_DAYS = 7;
/** Days inside which an obligation counts towards the headline exposure. */
export const HORIZON_DAYS = 30;
/** MSMED §15 — a receivable older than this is a statutory claim. */
export const RECEIVABLE_OVERDUE_DAYS = 45;

export type Tone = "danger" | "warn" | "credit" | "calm" | "unknown";

export interface UrgencyChipModel {
  tone: Tone;
  text: string;
  /** 0–3. Drives the bar meter, so urgency reads before the words do. */
  level: number;
}

function toneForDaysLeft(days: number | null): Tone {
  if (days === null) return "unknown";
  if (days <= CRITICAL_DAYS) return "danger";
  if (days <= HORIZON_DAYS) return "warn";
  return "calm";
}

function levelForTone(tone: Tone): number {
  if (tone === "danger") return 3;
  if (tone === "warn") return 2;
  if (tone === "credit") return 2;
  if (tone === "calm") return 1;
  return 0;
}

/**
 * The single deadline signal for a row.
 *
 * Payables and licences count down. Receivables count up — what matters is
 * how long the money has been sitting with somebody else.
 */
export function chipForRow(row: ObligationRow, now: Date): UrgencyChipModel {
  if (row.direction === "owed") {
    const age = daysSince(row.doc_date ?? row.deadline, now);

    if (age !== null && age > RECEIVABLE_OVERDUE_DAYS) {
      return { tone: "danger", text: agePhrase(age), level: 3 };
    }
    if (age !== null && age >= 0) {
      return { tone: "credit", text: agePhrase(age), level: 1 };
    }

    return { tone: "unknown", text: deadlinePhrase(null), level: 0 };
  }

  const left = daysUntil(row.deadline, now);
  const tone = toneForDaysLeft(left);
  const text =
    row.doc_type === "licence" ? expiryPhrase(left) : deadlinePhrase(left);

  return { tone, text, level: levelForTone(tone) };
}

/** Tailwind classes per tone, kept in one place so tones cannot drift. */
export const CHIP_CLASSES: Record<Tone, string> = {
  danger: "bg-danger-wash text-danger border-danger-rule",
  warn: "bg-warn-wash text-warn border-warn-rule",
  credit: "bg-credit-wash text-credit border-credit-rule",
  calm: "bg-paper-sunk text-ink-soft border-rule",
  unknown: "bg-paper-sunk text-ink-faint border-rule",
};

export const STRIPE_CLASSES: Record<Tone, string> = {
  danger: "bg-danger",
  warn: "bg-warn",
  credit: "bg-credit",
  calm: "bg-rule-strong",
  unknown: "bg-rule",
};

export const TONE_TEXT_CLASSES: Record<Tone, string> = {
  danger: "text-danger",
  warn: "text-warn",
  credit: "text-credit",
  calm: "text-ink",
  unknown: "text-ink-faint",
};
