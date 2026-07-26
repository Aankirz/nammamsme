// In-memory document store, seeded from data/seed.json.
//
// Storage decision: D-07 locks Supabase, but the credentials are not available yet.
// Everything below sits behind `DocumentStore`, whose methods are all async, so a
// Supabase-backed implementation can replace `createMemoryStore` without any caller
// changing. Callers must never reach past this interface.

import seedJson from "@/data/seed.json";
import type { Direction, DocType, ObligationRow, RowRole, Status } from "@/lib/types";

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

/**
 * What the store actually holds. Assignable to `ObligationRow` everywhere, so
 * consumers that only know the shared contract keep working unchanged.
 */
export type StoredRow = ObligationRow & {
  evidence?: SeedEvidence;
  notice?: SeedNotice;
};

// ---------- Runtime validation of the seed ----------

const ROLES: readonly RowRole[] = ["obligation", "evidence"];
const DOC_TYPES: readonly DocType[] = ["gst_notice", "supplier_invoice", "licence"];
const DIRECTIONS: readonly Direction[] = ["owing", "owed"];
const STATUSES: readonly Status[] = ["seeded", "extracted", "refused", "filed"];

function fail(index: number, message: string): never {
  throw new Error(`data/seed.json row ${index}: ${message}`);
}

/**
 * The JSON import widens string literals to `string`, so the union members are not
 * checked at compile time. Check them at load instead — a bad seed fails loudly at
 * first access rather than silently rendering a broken inbox on stage.
 */
function validateSeed(raw: unknown): StoredRow[] {
  if (!Array.isArray(raw)) throw new Error("data/seed.json must be an array");

  return raw.map((value, index) => {
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
    if (!Array.isArray(row.blockers)) fail(index, "blockers must be an array");
    if (typeof row.created_at !== "string") fail(index, "missing created_at");

    return row as unknown as StoredRow;
  });
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
