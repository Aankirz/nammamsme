/**
 * Every string the owner reads lives here or in a component's JSX.
 *
 * Tone, from PRODUCT.md: state the number, state the date, state what happens
 * if ignored, stop. No legal register, no chirpiness, no emoji, no em dashes.
 */

import type { DocType } from "@/lib/types";

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  gst_notice: "GST notice",
  supplier_invoice: "Invoice",
  licence: "Licence",
};

/** The mark on the paper itself. Short enough to sit in a rail row. */
export const DOC_TYPE_STAMP: Record<DocType, string> = {
  gst_notice: "GST",
  supplier_invoice: "BILL",
  licence: "LIC",
};

const MONTHS = [
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

/**
 * "14 August 2026". Built by hand so the output cannot vary with the server's
 * ICU build, which would otherwise differ between local and deploy.
 */
export function formatDate(iso: string | null | undefined): string | null {
  if (typeof iso !== "string" || iso.length < 10) return null;

  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));

  if (!Number.isFinite(year) || month < 1 || month > 12 || !day) return null;

  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** "14 Aug 2026". For rail rows, where the column is 360px wide. */
export function formatDateShort(iso: string | null | undefined): string | null {
  const full = formatDate(iso);
  if (full === null) return null;

  const [day, month, year] = full.split(" ");
  return `${day} ${month.slice(0, 3)} ${year}`;
}

/** How a payment or reply deadline reads. */
export function deadlinePhrase(days: number | null): string {
  if (days === null) return "No date found";
  if (days < 0) return `${-days} days late`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days left`;
}

/** How an unpaid receivable reads. Age, not time remaining. */
export function agePhrase(days: number): string {
  if (days === 1) return "1 day unpaid";
  return `${days} days unpaid`;
}

/** How a licence expiry reads. */
export function expiryPhrase(days: number | null): string {
  if (days === null) return "No date found";
  if (days < 0) return `Expired ${-days} days ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

/** The day-count that sits in a rail row. Terse: the rule carries the colour. */
export function dayCountPhrase(days: number | null, isExpiry: boolean): string {
  if (days === null) return "no date";
  if (days < 0) return `${-days}d late`;
  if (days === 0) return "today";
  return isExpiry ? `${days}d to expiry` : `${days}d left`;
}

/** Why the money slot is empty. A licence has no price; a notice should. */
export function noAmountPhrase(docType: DocType): string {
  return docType === "licence" ? "Nothing to pay" : "No amount found";
}

/**
 * What the prose section is called. A notice alleges something; a licence and
 * an invoice only state their terms, and accusing language on either would be
 * wrong.
 */
export function allegationHeading(docType: DocType): string {
  return docType === "gst_notice" ? "What they say you did" : "What this document says";
}

export function documentCountPhrase(count: number): string {
  return count === 1 ? "1 document" : `${count} documents`;
}

const ACRONYM = /\(([A-Za-z]{2,10})\)/;
const SHORT_NAME_LIMIT = 26;

/**
 * Counterparty names on official paper run long: "Food Safety and Standards
 * Authority of India (FSSAI)". The rail needs the name the owner uses.
 */
export function shortName(name: string): string {
  const acronym = ACRONYM.exec(name);
  if (acronym) return acronym[1];

  const beforeComma = name.split(",")[0].trim();
  if (beforeComma.length <= SHORT_NAME_LIMIT) return beforeComma;

  return `${beforeComma.slice(0, SHORT_NAME_LIMIT - 1).trimEnd()}...`;
}
