/**
 * Urgency is a colour and a rule, not a sentence. The owner should be able to
 * scan the rail with the words blurred and still know what is on fire.
 *
 * DESIGN.md: a small mono day-count plus a 2px top rule in the state colour.
 * Never a coloured left edge.
 */

import type { ObligationRow } from "@/lib/types";
import { agePhrase, dayCountPhrase, deadlinePhrase, expiryPhrase } from "./copy";
import { daysSince, daysUntil } from "./dates";

/** Days at which an obligation turns to stamp red. */
export const CRITICAL_DAYS = 7;
/** Days inside which an obligation counts towards the headline exposure. */
export const HORIZON_DAYS = 30;
/** MSMED section 15. A receivable older than this is a statutory claim. */
export const RECEIVABLE_OVERDUE_DAYS = 45;

/** Maps onto the semantic tokens: stamp, pending, settled, and plain rule. */
export type Tone = "stamp" | "pending" | "settled" | "quiet" | "unknown";

export interface Urgency {
  tone: Tone;
  /** Full sentence. "19 days left" / "92 days unpaid" */
  phrase: string;
  /** Rail-width form. "19d left" */
  count: string;
  /** Days to the deadline, negative once passed. Null when there is no date. */
  days: number | null;
}

export function toneForDaysLeft(days: number | null): Tone {
  if (days === null) return "unknown";
  if (days <= CRITICAL_DAYS) return "stamp";
  if (days <= HORIZON_DAYS) return "pending";
  return "quiet";
}

/**
 * The single deadline signal for a row.
 *
 * Payables and licences count down. A receivable counts up, because what
 * matters is how long the owner's money has been sitting with somebody else.
 */
export function urgencyFor(row: ObligationRow, now: Date): Urgency {
  if (row.direction === "owed") {
    const age = daysSince(row.doc_date ?? row.deadline, now);

    if (age === null) {
      return {
        tone: "unknown",
        phrase: deadlinePhrase(null),
        count: "no date",
        days: null,
      };
    }

    return {
      tone: age > RECEIVABLE_OVERDUE_DAYS ? "stamp" : "settled",
      phrase: agePhrase(age),
      count: `${age}d unpaid`,
      days: -age,
    };
  }

  const left = daysUntil(row.deadline, now);
  const isLicence = row.doc_type === "licence";

  return {
    tone: toneForDaysLeft(left),
    phrase: isLicence ? expiryPhrase(left) : deadlinePhrase(left),
    count: dayCountPhrase(left, isLicence),
    days: left,
  };
}

/** The 2px state rule that sits on top of a row or panel. */
export const TONE_RULE_CLASSES: Record<Tone, string> = {
  stamp: "bg-stamp",
  pending: "bg-pending",
  settled: "bg-settled",
  quiet: "bg-rule-strong",
  unknown: "bg-rule",
};

/** Text colour for the day-count itself. */
export const TONE_TEXT_CLASSES: Record<Tone, string> = {
  stamp: "text-stamp",
  pending: "text-pending",
  settled: "text-settled",
  quiet: "text-ink-muted",
  unknown: "text-ink-faint",
};
