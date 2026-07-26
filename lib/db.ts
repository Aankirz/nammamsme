// In-memory document store, seeded from data/seed.json.
//
// Storage decision: D-07 locks Supabase, but the credentials are not available yet.
// Everything below sits behind `DocumentStore`, whose methods are all async, so a
// Supabase-backed implementation can replace `createMemoryStore` without any caller
// changing. Callers must never reach past this interface.

import seedJson from "@/data/seed.json";
import type {
  Blocker,
  BlockerKind,
  Direction,
  DocType,
  ObligationRow,
  RowRole,
  Status,
} from "@/lib/types";

// ---------- Seed-only metadata (D-08 keeps ObligationRow at ten columns) ----------

/**
 * Per-invoice figures that evidence assembly (D-14) needs but that do not belong
 * in the shared ten-column schema. Present on the 14 purchase invoices only.
 *
 * `unmatched` is the seeded label for the three invoices the department cannot see
 * in GSTR-2B. D-05: *which* three is seeded; the ₹4,00,000 gap itself is derived.
 * The same figures also appear in the row's Hindi `obligation` text, so a consumer
 * that prefers to parse prose is not blocked on this field.
 */
export interface SeedEvidence {
  invoice_ref: string;
  taxable: number;
  gst: number;
  gst_rate: number;
  unmatched: boolean;
}

/** Notice-stated figures, on the hero GST notice row only. Mirrors VerifiedFields. */
export interface SeedNotice {
  section: string;
  tax: number;
  interest: number;
  penalty: number;
  total: number;
  claimed_itc: number;
  matched_itc: number;
  unmatched_itc: number;
  period_start: string;
  period_end: string;
}

/** One OCR block, flattened from Sarvam's Digitise output. Coordinates are page pixels. */
export interface SeedSourceBlock {
  page: number;
  block: number;
  text: string;
  /** [x1, y1, x2, y2] in page pixels, so the UI can crop or highlight the region. */
  bbox: [number, number, number, number];
}

/**
 * The document behind a row, enough to draw a facsimile with highlightable
 * regions. Present on the two GST notices, which are the only rows whose figures
 * a user will want to trace back to the page (PRODUCT.md principle 3).
 */
export interface SeedSource {
  pageWidth: number;
  pageHeight: number;
  blocks: SeedSourceBlock[];
}

/**
 * What the store actually holds. Assignable to `ObligationRow` everywhere, so
 * consumers that only know the shared contract keep working unchanged.
 */
export type StoredRow = ObligationRow & {
  evidence?: SeedEvidence;
  notice?: SeedNotice;
  source?: SeedSource;
};

// ---------- Runtime validation of the seed ----------

const ROLES: readonly RowRole[] = ["obligation", "evidence"];
const DOC_TYPES: readonly DocType[] = ["gst_notice", "supplier_invoice", "licence"];
const DIRECTIONS: readonly Direction[] = ["owing", "owed"];
const STATUSES: readonly Status[] = ["seeded", "extracted", "refused", "filed"];
const BLOCKER_KINDS: readonly BlockerKind[] = [
  "amount_disagreement",
  "missing_annexure",
  "missing_field",
];
const BBOX_LENGTH = 4;

function fail(index: number, message: string): never {
  throw new Error(`data/seed.json row ${index}: ${message}`);
}

function isPositiveInteger(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) > 0;
}

function validateSourceRef(index: number, where: string, raw: unknown): void {
  const ref = raw as { page?: unknown; block?: unknown; bbox?: unknown };

  if (!Number.isInteger(ref.page)) fail(index, `${where}.page must be an integer`);
  if (!Number.isInteger(ref.block)) fail(index, `${where}.block must be an integer`);
  if (ref.bbox === undefined) return;
  if (!Array.isArray(ref.bbox) || ref.bbox.length !== BBOX_LENGTH) {
    fail(index, `${where}.bbox must hold four numbers`);
  }
  if (!ref.bbox.every((n) => typeof n === "number" && Number.isFinite(n))) {
    fail(index, `${where}.bbox must hold four numbers`);
  }
}

/**
 * A blocker is the one thing standing between the user and a filed reply (D-12),
 * so a malformed one is worse than none: the UI would disable the button without
 * being able to say why.
 */
function validateBlockers(index: number, raw: unknown): void {
  if (!Array.isArray(raw)) fail(index, "blockers must be an array");

  raw.forEach((value, position) => {
    const blocker = value as Partial<Blocker>;
    const where = `blockers[${position}]`;

    if (!BLOCKER_KINDS.includes(blocker.kind as BlockerKind)) {
      fail(index, `${where}: bad kind ${String(blocker.kind)}`);
    }
    if (typeof blocker.detail !== "string" || blocker.detail.trim() === "") {
      fail(index, `${where}: a blocker must say why, in words`);
    }
    if (blocker.sourceRef !== undefined) {
      validateSourceRef(index, `${where}.sourceRef`, blocker.sourceRef);
    }
  });
}

/** Bounding boxes that fall outside the page draw highlights nobody can see. */
function validateSourceBlock(index: number, source: SeedSource, raw: unknown): void {
  const block = raw as Partial<SeedSourceBlock>;
  const where = `source.blocks[${String(block.block)}]`;

  if (!Number.isInteger(block.page)) fail(index, `${where}.page must be an integer`);
  if (!Number.isInteger(block.block)) fail(index, `${where}.block must be an integer`);
  if (typeof block.text !== "string" || block.text.trim() === "") {
    fail(index, `${where}.text is empty`);
  }
  // A source block without a box cannot be highlighted, so here bbox is required.
  if (block.bbox === undefined) fail(index, `${where}.bbox is required`);
  validateSourceRef(index, where, block);

  const [x1, y1, x2, y2] = block.bbox as [number, number, number, number];
  if (x2 <= x1 || y2 <= y1) fail(index, `${where}.bbox is inverted`);
  if (x1 < 0 || y1 < 0 || x2 > source.pageWidth || y2 > source.pageHeight) {
    fail(index, `${where}.bbox falls outside the page`);
  }
}

function validateSource(index: number, raw: unknown): void {
  const source = raw as Partial<SeedSource>;

  if (!isPositiveInteger(source.pageWidth)) fail(index, "source.pageWidth must be a positive integer");
  if (!isPositiveInteger(source.pageHeight)) fail(index, "source.pageHeight must be a positive integer");
  if (!Array.isArray(source.blocks) || source.blocks.length === 0) {
    fail(index, "source.blocks must be a non-empty array");
  }

  for (const block of source.blocks) {
    validateSourceBlock(index, source as SeedSource, block);
  }
}

/** The notice's own arithmetic. D-11 tolerates this on a live document; a seed has no excuse. */
function validateNotice(index: number, notice: SeedNotice, amount: number | null): void {
  if (notice.tax + notice.interest + notice.penalty !== notice.total) {
    fail(index, "notice: tax + interest + penalty does not equal total");
  }
  if (notice.claimed_itc - notice.matched_itc !== notice.unmatched_itc) {
    fail(index, "notice: claimed_itc - matched_itc does not equal unmatched_itc");
  }
  if (amount !== notice.total) fail(index, "notice.total does not equal the row amount");
}

function validateEvidence(index: number, evidence: SeedEvidence, amount: number | null): void {
  if (evidence.taxable + evidence.gst !== amount) {
    fail(index, "evidence: taxable + gst does not equal the row amount");
  }
  if ((evidence.taxable * evidence.gst_rate) / 100 !== evidence.gst) {
    fail(index, `evidence: gst is not ${evidence.gst_rate}% of taxable`);
  }
}

/**
 * The ITC story has to tie out ACROSS rows, not merely within each one. The 14
 * purchase invoices are the defence assembled against the notice (D-14), so their
 * GST must sum to exactly what the notice says was claimed, and the invoices the
 * department cannot see must sum to exactly the gap it is demanding. A seed that
 * fails this renders a reply that argues against itself.
 */
function validateItcReconciliation(rows: readonly StoredRow[]): void {
  const withNotice = rows.filter((row) => row.notice !== undefined);
  if (withNotice.length !== 1) {
    throw new Error(`data/seed.json: expected exactly one row carrying notice figures, found ${withNotice.length}`);
  }

  const notice = withNotice[0].notice as SeedNotice;
  const evidence = rows.flatMap((row) => (row.evidence ? [row.evidence] : []));
  const sumGst = (list: readonly SeedEvidence[]) => list.reduce((total, item) => total + item.gst, 0);
  const unmatched = evidence.filter((item) => item.unmatched);

  const gates: readonly [string, number, number][] = [
    ["evidence GST total vs notice claimed_itc", sumGst(evidence), notice.claimed_itc],
    ["matched evidence GST vs notice matched_itc", sumGst(evidence) - sumGst(unmatched), notice.matched_itc],
    ["unmatched evidence GST vs notice unmatched_itc", sumGst(unmatched), notice.unmatched_itc],
  ];

  for (const [label, actual, expected] of gates) {
    if (actual !== expected) {
      throw new Error(`data/seed.json: ${label}, got ${actual}, expected ${expected}`);
    }
  }
}

/**
 * The JSON import widens string literals to `string`, so the union members are not
 * checked at compile time. Check them at load instead — a bad seed fails loudly at
 * first access rather than silently rendering a broken inbox on stage.
 */
function validateSeed(raw: unknown): StoredRow[] {
  if (!Array.isArray(raw)) throw new Error("data/seed.json must be an array");

  const rows = raw.map((value, index) => {
    const row = value as Record<string, unknown>;

    if (typeof row.id !== "string" || row.id.length === 0) fail(index, "missing id");
    if (!ROLES.includes(row.role as RowRole)) fail(index, `bad role ${String(row.role)}`);
    if (!DOC_TYPES.includes(row.doc_type as DocType)) fail(index, `bad doc_type ${String(row.doc_type)}`);
    if (!DIRECTIONS.includes(row.direction as Direction)) fail(index, `bad direction ${String(row.direction)}`);
    if (!STATUSES.includes(row.status as Status)) fail(index, `bad status ${String(row.status)}`);
    if (typeof row.obligation !== "string") fail(index, "missing obligation");
    if (typeof row.counterparty !== "string") fail(index, "missing counterparty");
    if (typeof row.consequence !== "string") fail(index, "missing consequence");
    if (row.amount !== null && !Number.isInteger(row.amount)) fail(index, "amount must be an integer or null");
    if (typeof row.created_at !== "string") fail(index, "missing created_at");

    validateBlockers(index, row.blockers);
    if (row.source_ref !== null && row.source_ref !== undefined) {
      validateSourceRef(index, "source_ref", row.source_ref);
    }
    if (row.source !== undefined) validateSource(index, row.source);
    if (row.notice !== undefined) {
      validateNotice(index, row.notice as SeedNotice, row.amount as number | null);
    }
    if (row.evidence !== undefined) {
      validateEvidence(index, row.evidence as SeedEvidence, row.amount as number | null);
    }

    return row as unknown as StoredRow;
  });

  validateItcReconciliation(rows);
  return rows;
}

const SEED: readonly StoredRow[] = validateSeed(seedJson);

/** Deep copy so callers can never mutate the pristine seed or each other's rows. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---------- Store interface ----------

export interface DocumentStore {
  listDocuments(): Promise<StoredRow[]>;
  getDocument(id: string): Promise<StoredRow | null>;
  insertDocument(row: StoredRow): Promise<StoredRow>;
  /** Returns the updated row, or null when `id` is unknown. */
  updateDocument(id: string, patch: Partial<StoredRow>): Promise<StoredRow | null>;
  /** Clears the store, reseeds from data/seed.json, returns the row count. */
  reset(): Promise<number>;
}

function createMemoryStore(): DocumentStore {
  // Insertion-ordered. Sorting is the caller's concern (see sortByDeadlineAsc).
  let rows: StoredRow[] = clone(SEED as StoredRow[]);

  return {
    async listDocuments() {
      return clone(rows);
    },

    async getDocument(id) {
      const found = rows.find((row) => row.id === id);
      return found ? clone(found) : null;
    },

    async insertDocument(row) {
      const stored = clone(row);
      rows = [...rows, stored];
      return clone(stored);
    },

    async updateDocument(id, patch) {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return null;

      // Immutable update: new row object, new array. Never mutate in place.
      const updated: StoredRow = { ...rows[index], ...clone(patch), id };
      rows = [...rows.slice(0, index), updated, ...rows.slice(index + 1)];
      return clone(updated);
    },

    async reset() {
      rows = clone(SEED as StoredRow[]);
      return rows.length;
    },
  };
}

// ---------- Singleton ----------

// Next.js dev hot-reloads modules; without this the store resets on every edit and
// a filed ARN vanishes mid-demo. Serverless cold starts still reset it — acceptable
// for the hackathon, and the reason the interface above exists.
const globalStore = globalThis as typeof globalThis & {
  __nammamsmeStore?: DocumentStore;
};

export const db: DocumentStore = (globalStore.__nammamsmeStore ??= createMemoryStore());

// ---------- Shared helpers ----------

/** Deadline ascending, rows with no deadline last. Stable within each group. */
export function sortByDeadlineAsc(rows: readonly StoredRow[]): StoredRow[] {
  return [...rows].sort((a, b) => {
    if (a.deadline === b.deadline) return 0;
    if (a.deadline === null) return 1;
    if (b.deadline === null) return -1;
    return a.deadline < b.deadline ? -1 : 1;
  });
}
