/**
 * Every string the trader reads lives here or in a component's JSX.
 * Hindi (Devanagari) only — no mixed-language surfaces (decision D-06).
 */

import type { DocType } from "@/lib/types";

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  gst_notice: "जीएसटी नोटिस",
  supplier_invoice: "सप्लायर बिल",
  licence: "लाइसेंस",
};

/** Short Latin stamp for the corner of a row. Deliberately not translated —
 *  traders read "GST" on the paper itself. */
export const DOC_TYPE_STAMP: Record<DocType, string> = {
  gst_notice: "GST",
  supplier_invoice: "BILL",
  licence: "LIC",
};

const MONTHS_HI = [
  "जनवरी",
  "फ़रवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर",
];

/** "26 जुलाई 2026". Built by hand so the output cannot vary with the
 *  server's ICU build. */
export function formatHindiDate(iso: string | null | undefined): string | null {
  if (typeof iso !== "string" || iso.length < 10) {
    return null;
  }

  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));

  if (!Number.isFinite(year) || month < 1 || month > 12 || !day) {
    return null;
  }

  return `${day} ${MONTHS_HI[month - 1]} ${year}`;
}

/** How a payment deadline reads. */
export function deadlinePhrase(days: number | null): string {
  if (days === null) {
    return "तारीख़ नहीं मिली";
  }
  if (days < 0) {
    return `${-days} दिन देर`;
  }
  if (days === 0) {
    return "आज आख़िरी दिन";
  }
  if (days === 1) {
    return "कल आख़िरी दिन";
  }

  return `${days} दिन बाकी`;
}

/** How an unpaid receivable reads — age, not time remaining. */
export function agePhrase(days: number): string {
  return `${days} दिन पुराना`;
}

/** How a licence expiry reads. */
export function expiryPhrase(days: number | null): string {
  if (days === null) {
    return "तारीख़ नहीं मिली";
  }
  if (days < 0) {
    return `${-days} दिन पहले खत्म`;
  }
  if (days === 0) {
    return "आज खत्म";
  }

  return `${days} दिन में खत्म`;
}

/** "3 दस्तावेज़" */
export function documentCountPhrase(count: number): string {
  return `${count} दस्तावेज़`;
}

/** Why the money slot is empty. A licence has no price; a notice should. */
export function noAmountPhrase(docType: DocType): string {
  return docType === "licence" ? "कोई रक़म नहीं" : "रक़म नहीं मिली";
}

const ACRONYM = /\(([A-Za-z]{2,10})\)/;
const SHORT_NAME_LIMIT = 22;

/**
 * Counterparty names on official paper run long — "भारतीय खाद्य सुरक्षा एवं
 * मानक प्राधिकरण (FSSAI)". The headline needs the name the trader uses.
 */
export function shortName(name: string): string {
  const acronym = ACRONYM.exec(name);
  if (acronym) {
    return acronym[1];
  }

  const beforeComma = name.split(",")[0].trim();
  if (beforeComma.length <= SHORT_NAME_LIMIT) {
    return beforeComma;
  }

  return `${beforeComma.slice(0, SHORT_NAME_LIMIT - 1).trimEnd()}…`;
}
