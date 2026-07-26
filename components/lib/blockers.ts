/**
 * Why filing is blocked, in words the owner can act on.
 *
 * D-12: refusal is gated on binary conditions, never a model score. Each
 * blocker carries its own plain-English `detail` from the verification layer;
 * the headline here says which of the three checks failed.
 */

import type { Blocker, BlockerKind } from "@/lib/types";
import type { DocumentRow } from "./documents";
import type { BlockKey } from "./source";
import { keyForRef } from "./trace";

const BLOCKER_HEADLINE: Record<BlockerKind, string> = {
  amount_disagreement: "Two readings of the same figure did not agree",
  missing_annexure: "A page this document refers to is not here",
  missing_field: "A figure we need is not on the page",
};

const FALLBACK_HEADLINE = "A check did not pass";

export interface TracedBlocker {
  headline: string;
  detail: string;
  /** Where on the page to look, when the verification layer said. */
  blockKey: BlockKey | null;
  /** "Page 1, block 7" for anyone who wants the raw reference. */
  reference: string | null;
}

function referenceFor(blocker: Blocker): string | null {
  if (!blocker.sourceRef) return null;
  return `Page ${blocker.sourceRef.page}, block ${blocker.sourceRef.block}`;
}

export function traceBlockers(row: DocumentRow): TracedBlocker[] {
  return row.blockers.map((blocker) => ({
    headline: BLOCKER_HEADLINE[blocker.kind] ?? FALLBACK_HEADLINE,
    detail: blocker.detail,
    blockKey: keyForRef(blocker.sourceRef),
    reference: referenceFor(blocker),
  }));
}

/** The sentence wired to the disabled file button through `aria-describedby`. */
export function blockedReason(count: number): string {
  if (count === 1) return "Filing is off until one unresolved check is settled.";
  return `Filing is off until ${count} unresolved checks are settled.`;
}
