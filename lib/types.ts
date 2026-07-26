export type DocType = "gst_notice" | "supplier_invoice" | "licence" | "gst_return";

export type ReturnForm = "GSTR-1" | "GSTR-3B" | "GSTR-9";

export type ReturnState = "filed" | "due" | "overdue";

export interface ReturnDetail {
  form: ReturnForm;
  period_label: string;
  period_start: string;
  period_end: string;
  state: ReturnState;
  filed_on: string | null;
  arn: string | null;
  tax_payable: number | null;
  itc_claimed: number | null;
  itc_available: number | null;
  late_fee: number | null;
  days_late: number;
  blocks: string[];
  led_to: string | null;
}

export type Direction = "owing" | "owed";

export type Status = "seeded" | "extracted" | "refused" | "filed";

export type RowRole = "obligation" | "evidence";

export type BlockerKind = "amount_disagreement" | "missing_annexure" | "missing_field";

export interface Blocker {
  kind: BlockerKind;
  field?: string;
  detail: string;
  sourceRef?: SourceRef;
}

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

export interface ObligationRow {
  id: string;
  role: RowRole;
  doc_type: DocType;
  obligation: string;
  amount: number | null;
  doc_date: string | null;
  deadline: string | null;
  counterparty: string;
  consequence: string;
  direction: Direction;
  status: Status;
  blockers: Blocker[];
  source_ref: SourceRef | null;
  file_url: string | null;
  created_at: string;
}

export interface ExtractResult {
  fields: Record<string, string | null>;
}

export interface DigitiseBlock {
  page: number;
  block: number;
  text: string;
}

export interface DigitiseResult {
  blocks: DigitiseBlock[];
  text: string;
}

export interface VerifiedFields {
  amount: number | null;
  tax: number | null;
  interest: number | null;
  penalty: number | null;
  doc_date: string | null;
  deadline: string | null;
  counterparty: string | null;
  section: string | null;
  claimed_itc: number | null;
  matched_itc: number | null;
}

export interface VerifyResult {
  fields: VerifiedFields;
  blockers: Blocker[];
  flags: Flag[];
  canFile: boolean;
}

export interface EvidenceRow {
  counterparty: string;
  invoice_ref: string;
  doc_date: string;
  taxable: number;
  gst: number;
}

export interface EvidenceResult {
  rows: EvidenceRow[];
  claimedTotal: number;
  matchedTotal: number;
  gap: number;
  periodStart: string;
  periodEnd: string;
}
