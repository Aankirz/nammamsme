/**
 * The consequence ladder arrives as one string from the reasoning model
 * (decision D-13 — it may write prose, never numbers). Newlines separate the
 * rungs. Many rungs lead with a date, which we lift out so it can be set apart.
 */

export interface ConsequenceStep {
  /** "30 दिन बाद" / "15 अगस्त 2026" — present only when the line leads with one. */
  when: string | null;
  text: string;
}

/** A short leading clause followed by a dash or colon, containing a digit. */
const LEADING_CLAUSE = /^(.{2,30}?)\s*[—–:\-]\s+(.+)$/;
const CONTAINS_DIGIT = /\d/;
/** Strips "1." / "2)" / "•" that models like to prepend. */
const LIST_MARKER = /^\s*(?:[-•*]|\d{1,2}[.)])\s+/;

function parseLine(line: string): ConsequenceStep {
  const cleaned = line.replace(LIST_MARKER, "").trim();
  const match = LEADING_CLAUSE.exec(cleaned);

  if (match && CONTAINS_DIGIT.test(match[1])) {
    return { when: match[1].trim(), text: match[2].trim() };
  }

  return { when: null, text: cleaned };
}

export function parseConsequence(raw: string): ConsequenceStep[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseLine);
}
