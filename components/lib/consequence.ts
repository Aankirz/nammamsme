/**
 * The consequence arrives as one string from the reasoning model (D-13: it may
 * write prose, never numbers). Newlines separate the steps where the model
 * supplies them; a single paragraph is split on sentence ends so the ladder
 * still reads as a sequence of things that happen rather than a wall.
 *
 * Many steps lead with a date, which is lifted out so it can be set apart.
 */

export interface ConsequenceStep {
  /** "After 14 August 2026" / "Within 30 days". Null when the step has none. */
  when: string | null;
  text: string;
}

/** A short leading clause closed by a colon or dash, containing a digit. */
const LEADING_CLAUSE = /^(.{2,34}?)\s*[:—–-]\s+(.+)$/;
const CONTAINS_DIGIT = /\d/;
/** Strips "1." / "2)" / "-" that models like to prepend. */
const LIST_MARKER = /^\s*(?:[-*•]|\d{1,2}[.)])\s+/;
/** A full stop followed by a capital. Abbreviations keep their period. */
const SENTENCE_END = /(?<=[.!?])\s+(?=[A-Z])/;

function parseLine(line: string): ConsequenceStep {
  const cleaned = line.replace(LIST_MARKER, "").trim();
  const match = LEADING_CLAUSE.exec(cleaned);

  if (match && CONTAINS_DIGIT.test(match[1])) {
    return { when: match[1].trim(), text: match[2].trim() };
  }

  return { when: null, text: cleaned };
}

export function parseConsequence(raw: string): ConsequenceStep[] {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parts = lines.length > 1 ? lines : (lines[0]?.split(SENTENCE_END) ?? []);

  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseLine);
}
