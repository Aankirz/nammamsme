import type { DocType } from "./types";

const KEYWORDS: Record<DocType, readonly string[]> = {
  gst_notice: ["drc-01", "drc 01", "show cause", "section 73", "input tax credit"],
  gst_return: ["acknowledgement", "return filed", "filing successful", "filed on"],
  supplier_invoice: ["invoice no", "tax invoice", "hsn"],
  licence: ["licence", "license", "fssai", "valid until", "registration certificate"],
};

const PRIORITY: readonly DocType[] = [
  "gst_notice",
  "gst_return",
  "supplier_invoice",
  "licence",
];

function score(haystack: string, type: DocType): number {
  return KEYWORDS[type].filter((keyword) => haystack.includes(keyword)).length;
}

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
