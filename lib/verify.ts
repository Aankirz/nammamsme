// Cross-check the two Vision passes before we let anyone file a reply.
//
// Pure function: no network, no filesystem, no database. Two plain objects in,
// one plain object out. See decisionlog D-11 (arithmetic is a Flag, not a
// blocker) and D-12 (any blocker disables the file button).

import type {
  Blocker,
  DigitiseResult,
  ExtractResult,
  Flag,
  VerifiedFields,
  VerifyResult,
} from "./types";
import { collectAmounts, normaliseAmount, normaliseDate } from "./normalise";

const NUMERIC_FIELDS = ["amount", "tax", "interest", "penalty", "claimed_itc", "matched_itc"] as const;

/**
 * Interest runs to a stated date and penalty under s.73 is "10% of tax or
 * ₹10,000, whichever is higher". Real notices therefore miss exact equality by
 * small amounts. Anything at or below this is not worth mentioning.
 */
const ARITHMETIC_TOLERANCE = 100;

/** "Annexure A", "Schedule-1", "अनुबंध I" — keyword then a short identifier. */
const ANNEXURE_REF = /(annexures?|schedules?|अनुबंध)\s*(?:no\.?\s*)?[-–—:]?\s*([A-Z0-9IVX]{1,3})\b/gi;

const REAL_IDENTIFIER = /^[A-Z0-9]{1,3}$/; // uppercase letters, digits, roman numerals

function readFields(extract: ExtractResult): VerifiedFields {
  const raw = extract.fields;
  const text = (key: string): string | null => {
    const value = raw[key];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
  };
  return {
    amount: normaliseAmount(raw.amount),
    tax: normaliseAmount(raw.tax),
    interest: normaliseAmount(raw.interest),
    penalty: normaliseAmount(raw.penalty),
    doc_date: normaliseDate(raw.doc_date),
    deadline: normaliseDate(raw.deadline),
    counterparty: text("counterparty"),
    section: text("section"),
    claimed_itc: normaliseAmount(raw.claimed_itc),
    matched_itc: normaliseAmount(raw.matched_itc),
  };
}

/** Every numeric field the extract claims must also appear in the digitise text. */
function checkAmountAgreement(extract: ExtractResult, digitise: DigitiseResult): Blocker[] {
  const inText = collectAmounts(digitise.text);
  const blockers: Blocker[] = [];
  for (const field of NUMERIC_FIELDS) {
    const raw = extract.fields[field];
    if (raw == null) continue;
    const value = normaliseAmount(raw);
    if (value === null || inText.has(value)) continue;
    blockers.push({
      kind: "amount_disagreement",
      field,
      detail: `Extract reads ${field} as ₹${value.toLocaleString("en-IN")}, but that figure does not appear anywhere in the digitised text.`,
    });
  }
  return blockers;
}

/** Identifiers referenced by the notice body, deduped, in order of appearance. */
function referencedAnnexures(text: string): string[] {
  const ids = new Set<string>();
  for (const match of text.matchAll(ANNEXURE_REF)) {
    const id = match[2];
    if (REAL_IDENTIFIER.test(id)) ids.add(id);
  }
  return [...ids];
}

const keywordFor = (id: string, anchored: boolean) =>
  new RegExp(`${anchored ? "^\\s*" : ""}(annexures?|schedules?|अनुबंध)\\s*(?:no\\.?\\s*)?[-–—:]?\\s*${id}\\b`, anchored ? "im" : "i");

/**
 * The page carrying the *inline* mention of this annexure. Blocks that open
 * with the identifier are the annexure itself, not a reference to it.
 * Returns -1 when the identifier only ever appears as a heading — nothing is
 * being pointed at, so there is nothing to be missing.
 */
function pageOfReference(digitise: DigitiseResult, id: string): number {
  const inline = keywordFor(id, false);
  const heading = keywordFor(id, true);
  const block = digitise.blocks.find((b) => inline.test(b.text) && !heading.test(b.text));
  return block ? block.page : -1;
}

/** A block on a later page whose text opens a section with this identifier. */
function hasAnnexureBody(digitise: DigitiseResult, id: string, afterPage: number): boolean {
  if (afterPage < 0) return true;
  const heading = keywordFor(id, true);
  return digitise.blocks.some((b) => b.page > afterPage && heading.test(b.text));
}

function checkAnnexures(digitise: DigitiseResult): Blocker[] {
  return referencedAnnexures(digitise.text)
    .filter((id) => !hasAnnexureBody(digitise, id, pageOfReference(digitise, id)))
    .map((id) => ({
      kind: "missing_annexure" as const,
      detail: `The notice refers to Annexure ${id}, but no later page of the upload carries it. Ask the department for the missing page before replying.`,
    }));
}

function checkRequiredFields(fields: VerifiedFields): Blocker[] {
  const required: Array<[keyof VerifiedFields, string]> = [
    ["amount", "the total demanded"],
    ["deadline", "the reply-by date"],
  ];
  return required
    .filter(([key]) => fields[key] === null)
    .map(([key, label]) => ({
      kind: "missing_field" as const,
      field: String(key),
      detail: `Could not establish ${label} from either pass.`,
    }));
}

/** Tax + interest + penalty should equal the total. Off by a lot => Flag, never a blocker. */
function checkArithmetic(fields: VerifiedFields): Flag[] {
  const { amount, tax, interest, penalty } = fields;
  if (amount === null || tax === null || interest === null || penalty === null) return [];

  const expected = tax + interest + penalty;
  if (Math.abs(expected - amount) <= ARITHMETIC_TOLERANCE) return [];

  return [{
    kind: "arithmetic_mismatch",
    detail: `Tax + interest + penalty comes to ₹${expected.toLocaleString("en-IN")}, but the notice demands ₹${amount.toLocaleString("en-IN")}. Worth querying, but it does not stop you replying.`,
    expected,
    actual: amount,
  }];
}

/** Cross-check Extract against Digitise and decide whether filing is allowed. */
export function verifyExtraction(extract: ExtractResult, digitise: DigitiseResult): VerifyResult {
  const fields = readFields(extract);
  const blockers: Blocker[] = [
    ...checkAmountAgreement(extract, digitise),
    ...checkAnnexures(digitise),
    ...checkRequiredFields(fields),
  ];
  return { fields, blockers, flags: checkArithmetic(fields), canFile: blockers.length === 0 };
}
