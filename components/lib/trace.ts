/**
 * Tying a fact back to the place on the page it came from.
 *
 * The row carries at most one `source_ref`, but the owner can tap any figure,
 * so the rest are resolved by looking for the figure in the page text. The
 * comparison is normalised, never literal: "Rs. 5,12,000/-" and 512000 are the
 * same number, and a literal match would silently make figures untraceable.
 * Same rule as the verification layer (PRD, "Extraction and verification").
 *
 * Every function returns null rather than a guess. An untraceable figure
 * renders as plain text, which is honest.
 */

import type { SourceRef } from "@/lib/types";
import {
  blockKey,
  type BlockKey,
  type DocumentSource,
  type SourceBlock,
} from "./source";

/**
 * Runs of digits, optionally grouped with commas or full stops. Whitespace is
 * deliberately excluded: allowing it lets one token swallow the next figure on
 * the page, and the normalised comparison then fails on a document that matches.
 */
const NUMBER_TOKEN = /\d[\d,.]*\d|\d/g;
const NON_DIGIT = /\D/g;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function keyForRef(ref: SourceRef | null | undefined): BlockKey | null {
  if (!ref || typeof ref.page !== "number" || typeof ref.block !== "number") {
    return null;
  }
  return blockKey(ref.page, ref.block);
}

export function blockByKey(
  source: DocumentSource | null,
  key: BlockKey | null,
): SourceBlock | null {
  if (source === null || key === null) return null;
  return source.blocks.find((block) => blockKey(block.page, block.block) === key) ?? null;
}

function firstMatch(
  source: DocumentSource,
  predicate: (block: SourceBlock) => boolean,
): BlockKey | null {
  const found = source.blocks.find(predicate);
  return found ? blockKey(found.page, found.block) : null;
}

/**
 * The block printing this amount.
 *
 * Whole-token equality, not substring containment: "4,00,000" must not answer
 * for 40000, and a page full of figures would otherwise match almost anything.
 */
export function findAmountBlock(
  source: DocumentSource | null,
  amount: number | null | undefined,
): BlockKey | null {
  if (source === null || typeof amount !== "number" || !Number.isFinite(amount)) {
    return null;
  }

  const target = String(Math.round(Math.abs(amount)));

  return firstMatch(source, (block) => {
    const tokens = block.text.match(NUMBER_TOKEN);
    if (tokens === null) return false;

    return tokens.some((token) => token.replace(NON_DIGIT, "") === target);
  });
}

/** Every way a date is written on Indian official paper. */
function dateSpellings(iso: string): string[] {
  const year = iso.slice(0, 4);
  const month = iso.slice(5, 7);
  const day = iso.slice(8, 10);
  const monthIndex = Number(month) - 1;
  const monthName = MONTH_NAMES[monthIndex] ?? "";
  const bareDay = String(Number(day));

  return [
    `${day}/${month}/${year}`,
    `${day}-${month}-${year}`,
    `${day}.${month}.${year}`,
    `${year}-${month}-${day}`,
    `${bareDay} ${monthName} ${year}`,
    `${bareDay} ${monthName.slice(0, 3)} ${year}`,
    `${bareDay} ${monthName.slice(0, 3)}. ${year}`,
    // A month outside 1-12 leaves a hole where the name should be.
  ].filter((spelling) => !spelling.includes("  "));
}

export function findDateBlock(
  source: DocumentSource | null,
  iso: string | null | undefined,
): BlockKey | null {
  if (source === null || typeof iso !== "string" || iso.length < 10) return null;

  const spellings = dateSpellings(iso).map((spelling) => spelling.toLowerCase());

  return firstMatch(source, (block) => {
    const haystack = block.text.toLowerCase();
    return spellings.some((spelling) => haystack.includes(spelling));
  });
}

const NON_WORD = /[^a-z0-9]+/g;
const SIGNIFICANT_WORD_LENGTH = 4;

/**
 * The block naming this party. Matched on the first couple of substantial
 * words, because official paper prefixes names with "M/s" and suffixes them
 * with a city the extracted field may not carry.
 */
export function findPartyBlock(
  source: DocumentSource | null,
  name: string | null | undefined,
): BlockKey | null {
  if (source === null || typeof name !== "string") return null;

  const words = name
    .toLowerCase()
    .replace(NON_WORD, " ")
    .split(" ")
    .filter((word) => word.length >= SIGNIFICANT_WORD_LENGTH)
    .slice(0, 2);

  if (words.length === 0) return null;

  return firstMatch(source, (block) => {
    const haystack = block.text.toLowerCase().replace(NON_WORD, " ");
    return words.every((word) => haystack.includes(word));
  });
}
