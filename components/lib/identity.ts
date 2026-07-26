/**
 * Whose desk this is.
 *
 * STUB. There is no account system and no login (PRD, "Out of Scope"), so the
 * business identity is not carried on the API. It is stated here so the
 * masthead can name the business the notices are addressed to. When ingestion
 * lands, this comes from the GSTIN on the first document processed.
 */

export const BUSINESS = {
  name: "Gupta Hosiery Mills",
  gstin: "03AABCG1234H1Z5",
  place: "Ludhiana",
} as const;
