// Shared contract. Owned by the coordinator — do not edit in a subagent.
// See decisionlog.md D-08 (schema), D-09 (doc_date vs deadline), D-12 (blockers).

export type DocType = "gst_notice" | "supplier_invoice" | "licence";

export type Direction = "owing" | "owed";

export type Status = "seeded" | "extracted" | "refused" | "filed";

/** Why filing is blocked. Any blocker present => file button disabled. D-12. */
export type BlockerKind =
  | "amount_disagreement" // Extract and Digitise disagree after normalisation
  | "missing_annexure" // document references a page we do not have
  | "missing_field"; // a required field is absent

export interface Blocker {
  kind: BlockerKind;
  field?: string;
  detail: string; // shown to the user, in Hindi at the UI layer
  sourceRef?: SourceRef; // so the UI can crop the region
}

/** Non-blocking observation. Arithmetic mismatch lands here, not in Blocker. D-11. */
export interface Flag {
  kind: "arithmetic_mismatch";
  detail: string;
  expected: number;
  actual: number;
}

export interface SourceRef {
  page: number;
  block: number;
  bbox?: [number, number, number, number];
}

/**
 * What a row is FOR.
 *
 * "obligation" — something the trader must act on. Appears in the inbox.
 * "evidence"   — a historical document that backs a claim (e.g. the purchase
 *                invoices supporting an ITC claim). Already settled; it is not a
 *                pending obligation and must NOT clutter the inbox. Surfaces only
 *                when a reply is assembled from it.
 *
 * Without this split the 14 evidence invoices render as year-overdue payables and
 * push the hero notice to the bottom of a deadline-sorted list. See D-30.
 */
export type RowRole = "obligation" | "evidence";

/** One row per document. Seeded and live rows are indistinguishable. D-08. */
export interface ObligationRow {
  id: string;
  role: RowRole;
  doc_type: DocType;
  obligation: string;
  amount: number | null; // paise-free rupees, integer
  doc_date: string | null; // ISO date. Invoice date / notice date. D-09.
  deadline: string | null; // ISO date. Reply-by / pay-by / expires-on. D-09.
  counterparty: string;
  consequence: string;
  direction: Direction;
  status: Status;
  blockers: Blocker[];
  source_ref: SourceRef | null;
  file_url: string | null;
  created_at: string;
}

// ---------- Sarvam Vision shapes (narrowed to what we consume) ----------

/** Vision Extract: named fields returned directly. */
export interface ExtractResult {
  fields: Record<string, string | null>;
}

/** Vision Digitise: full page text with provenance. */
export interface DigitiseBlock {
  page: number;
  block: number;
  text: string;
}

export interface DigitiseResult {
  blocks: DigitiseBlock[];
  text: string; // all blocks joined, convenience
}

// ---------- Verification ----------

/** Fields that survived verification. Nulls mean "not established". */
export interface VerifiedFields {
  amount: number | null;
  tax: number | null;
  interest: number | null;
  penalty: number | null;
  doc_date: string | null;
  deadline: string | null;
  counterparty: string | null;
  section: string | null;
  claimed_itc: number | null; // notice-stated ITC the trader claimed
  matched_itc: number | null; // notice-stated ITC the department can see
}

export interface VerifyResult {
  fields: VerifiedFields;
  blockers: Blocker[];
  flags: Flag[];
  canFile: boolean; // blockers.length === 0
}

// ---------- Evidence assembly (D-14) ----------

export interface EvidenceRow {
  counterparty: string;
  invoice_ref: string;
  doc_date: string;
  taxable: number;
  gst: number;
}

export interface EvidenceResult {
  rows: EvidenceRow[];
  claimedTotal: number; // sum of gst across rows
  matchedTotal: number; // from the notice
  gap: number; // claimedTotal - matchedTotal, the unmatched portion
  periodStart: string;
  periodEnd: string;
}
