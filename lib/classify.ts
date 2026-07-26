// Which of the three document kinds are we looking at? Keyword scoring only —
// the user can always correct it, so a cheap deterministic guess beats a model
// call here.

import type { DocType } from "./types";

const KEYWORDS: Record<DocType, readonly string[]> = {
  gst_notice: ["drc-01", "drc 01", "show cause", "section 73", "input tax credit"],
  supplier_invoice: ["invoice no", "tax invoice", "hsn"],
  licence: ["licence", "license", "fssai", "valid until", "registration certificate"],
};

/** Checked in order, so the first listed type wins a tie. D-08 default: gst_notice. */
const PRIORITY: readonly DocType[] = ["gst_notice", "supplier_invoice", "licence"];

function score(haystack: string, type: DocType): number {
  return KEYWORDS[type].filter((keyword) => haystack.includes(keyword)).length;
}

/** Best-guess document type. Ties and empty input fall back to `gst_notice`. */
export function classifyDocType(text: string): DocType {
  const haystack = text.toLowerCase();
  let best: DocType = "gst_notice";
  let bestScore = 0;

  for (const type of PRIORITY) {
    const current = score(haystack, type);
    if (current > bestScore) {
      best = type;
      bestScore = current;
    }
  }

  return best;
}
