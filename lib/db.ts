import { createPgStore } from "./pg-store";
import seedJson from "@/data/seed.json";
import { checkRate, lookupRate } from "@/lib/rates";
import type {
  Blocker,
  BlockerKind,
  Direction,
  DocType,
  ObligationRow,
  ReturnDetail,
  ReturnForm,
  ReturnState,
  RowRole,
  Status,
} from "@/lib/types";

export interface SeedEvidence {
  invoice_ref: string;
  hsn?: string;
  goods?: string;
  taxable: number;
  gst: number;
  gst_rate: number;
  unmatched: boolean;
}

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

export interface SeedSourceBlock {
  page: number;
  block: number;
  text: string;
  bbox: [number, number, number, number];
}

export interface SeedSource {
  pageWidth: number;
  pageHeight: number;
  blocks: SeedSourceBlock[];
}

export type StoredRow = ObligationRow & {
  evidence?: SeedEvidence;
  notice?: SeedNotice;
  source?: SeedSource;
  return?: ReturnDetail;
};

const ROLES: readonly RowRole[] = ["obligation", "evidence"];
const DOC_TYPES: readonly DocType[] = [
  "gst_notice",
  "supplier_invoice",
  "licence",
  "gst_return",
];
const DIRECTIONS: readonly Direction[] = ["owing", "owed"];
const STATUSES: readonly Status[] = ["seeded", "extracted", "refused", "filed"];
const BLOCKER_KINDS: readonly BlockerKind[] = [
  "amount_disagreement",
  "missing_annexure",
  "missing_field",
];
const RETURN_FORMS: readonly ReturnForm[] = ["GSTR-1", "GSTR-3B", "GSTR-9"];
const RETURN_STATES: readonly ReturnState[] = ["filed", "due", "overdue"];
const BBOX_LENGTH = 4;

const SEED_REFERENCE_DATE = "2026-07-26";
const LAWFUL_RATE_MATCHES = 13;
const LAWFUL_RATE_MISMATCHES = 1;
const SINGLE_LAWFUL_RATE = 1;
const LATE_FEE_PER_DAY = 50;
const NIL_LATE_FEE_PER_DAY = 20;
const LATE_FEE_CAP = 5000;
const GSTR1_DUE_DAY = 11;
const GSTR3B_DUE_DAY = 20;
const MS_PER_DAY = 86_400_000;
const MONTHS_PER_YEAR = 12;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EWAY_BILL = /e-way bill/i;

function fail(index: number, message: string): never {
  throw new Error(`data/seed.json row ${index}: ${message}`);
}

function isPositiveInteger(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) > 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE.test(value);
}

function dayNumber(iso: string): number {
  return Math.round(Date.parse(`${iso}T00:00:00Z`) / MS_PER_DAY);
}

function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

function monthNumber(iso: string): number {
  return Number(iso.slice(0, 4)) * MONTHS_PER_YEAR + Number(iso.slice(5, 7));
}

function dueDateFor(form: ReturnForm, periodEnd: string): string {
  const year = Number(periodEnd.slice(0, 4));
  const month = Number(periodEnd.slice(5, 7));
  const nextYear = month === MONTHS_PER_YEAR ? year + 1 : year;
  const nextMonth = month === MONTHS_PER_YEAR ? 1 : month + 1;
  const day = form === "GSTR-1" ? GSTR1_DUE_DAY : GSTR3B_DUE_DAY;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lateFeeRateFor(detail: ReturnDetail): number {
  const isNilReturn = detail.form === "GSTR-3B" && detail.tax_payable === 0;
  return isNilReturn ? NIL_LATE_FEE_PER_DAY : LATE_FEE_PER_DAY;
}

function expectedLateFee(detail: ReturnDetail): number {
  const accrued = Math.max(detail.days_late, 0) * lateFeeRateFor(detail);
  return Math.min(accrued, LATE_FEE_CAP);
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

function validateSourceBlock(index: number, source: SeedSource, raw: unknown): void {
  const block = raw as Partial<SeedSourceBlock>;
  const where = `source.blocks[${String(block.block)}]`;

  if (!Number.isInteger(block.page)) fail(index, `${where}.page must be an integer`);
  if (!Number.isInteger(block.block)) fail(index, `${where}.block must be an integer`);
  if (typeof block.text !== "string" || block.text.trim() === "") {
    fail(index, `${where}.text is empty`);
  }
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
  if (typeof evidence.goods !== "string" || evidence.goods.trim() === "") {
    fail(index, "evidence: an invoice must say what was bought");
  }
  if (typeof evidence.hsn !== "string" || evidence.hsn.trim() === "") {
    fail(index, "evidence: an invoice must carry an HSN code");
  }

  const entry = lookupRate(evidence.hsn);
  if (entry === null || entry.code !== evidence.hsn) {
    fail(index, `evidence: HSN ${evidence.hsn} is not a code in the CBIC rate schedule`);
  }
  if (entry.rates.length !== SINGLE_LAWFUL_RATE) {
    fail(
      index,
      `evidence: HSN ${entry.code} carries ${entry.rates.length} lawful rates, so the rate check cannot be decisive`,
    );
  }
}

function validateReturnShape(index: number, detail: ReturnDetail): void {
  if (!RETURN_FORMS.includes(detail.form)) fail(index, `return: bad form ${String(detail.form)}`);
  if (!RETURN_STATES.includes(detail.state)) fail(index, `return: bad state ${String(detail.state)}`);
  if (!isIsoDate(detail.period_start)) fail(index, "return.period_start must be an ISO date");
  if (!isIsoDate(detail.period_end)) fail(index, "return.period_end must be an ISO date");
  if (detail.period_start >= detail.period_end) fail(index, "return: period_start is not before period_end");
  if (typeof detail.period_label !== "string" || detail.period_label.trim() === "") {
    fail(index, "return.period_label is empty");
  }
  if (!Number.isInteger(detail.days_late)) fail(index, "return.days_late must be an integer");
  if (!Array.isArray(detail.blocks)) fail(index, "return.blocks must be an array");
  if (!detail.blocks.every((entry) => typeof entry === "string" && entry.trim() !== "")) {
    fail(index, "return: a block must say what it stops, in words");
  }
}

function validateReturnState(index: number, detail: ReturnDetail, row: Record<string, unknown>): void {
  const dueDate = dueDateFor(detail.form, detail.period_end);
  const isFiled = detail.state === "filed";

  if (row.doc_date !== dueDate) {
    fail(index, `return: doc_date must be the statutory due date ${dueDate}`);
  }

  if (isFiled) {
    if (!isIsoDate(detail.filed_on)) fail(index, "return: a filed return needs filed_on");
    if (typeof detail.arn !== "string" || detail.arn.trim() === "") {
      fail(index, "return: a filed return needs an ARN");
    }
    if (row.deadline !== null) fail(index, "return: a filed return has nothing left to do, so deadline must be null");
    if (row.amount !== null) fail(index, "return: a filed return was paid when it was filed, so amount must be null");
    if (detail.blocks.length !== 0) fail(index, "return: a filed return blocks nothing");
    if (detail.days_late > 0) fail(index, "return: state is filed but days_late is positive");
  } else {
    if (detail.filed_on !== null) fail(index, "return: an unfiled return cannot carry filed_on");
    if (detail.arn !== null) fail(index, "return: an unfiled return cannot carry an ARN");
    if (row.deadline !== dueDate) fail(index, `return: an unfiled return's deadline must be ${dueDate}`);
    if (row.amount !== detail.tax_payable) {
      fail(index, "return: an unfiled return's amount must be its unpaid tax");
    }
    if (detail.itc_claimed !== null) fail(index, "return: an unfiled return has claimed no credit");
  }

  const referenceDay = detail.filed_on ?? SEED_REFERENCE_DATE;
  if (detail.days_late !== daysBetween(dueDate, referenceDay)) {
    fail(index, `return: days_late must be ${daysBetween(dueDate, referenceDay)} against ${dueDate}`);
  }
  if (detail.state === "overdue" && detail.days_late <= 0) {
    fail(index, "return: state is overdue but the due date has not passed");
  }
  if (detail.state === "due" && detail.days_late > 0) {
    fail(index, "return: state is due but the due date has passed");
  }
}

function validateReturnArithmetic(index: number, detail: ReturnDetail, consequence: string): void {
  const expected = expectedLateFee(detail);

  if (detail.late_fee !== expected) {
    fail(
      index,
      `return: late_fee is ${String(detail.late_fee)}, expected ${expected} at Rs ${lateFeeRateFor(detail)} a day capped at Rs ${LATE_FEE_CAP}`,
    );
  }
  if (detail.form === "GSTR-1") {
    if (detail.tax_payable !== null) fail(index, "return: no tax is paid with a GSTR-1");
    if (detail.itc_claimed !== null || detail.itc_available !== null) {
      fail(index, "return: a GSTR-1 carries no input tax credit figures");
    }
  }
  if (detail.state !== "overdue") return;

  if (detail.tax_payable !== null && !consequence.includes("18 percent a year")) {
    fail(index, "return: an overdue return carrying tax must say interest is running at 18 percent a year");
  }
  if (detail.late_fee >= LATE_FEE_CAP && !consequence.includes("capped")) {
    fail(index, "return: the late fee has hit the cap and the ladder does not say so");
  }
  if (detail.form === "GSTR-3B" && !detail.blocks.some((entry) => entry.includes("GSTR-1"))) {
    fail(index, "return: an unfiled GSTR-3B blocks the next GSTR-1 and must say so");
  }
}

function validateReturn(index: number, detail: ReturnDetail, row: Record<string, unknown>): void {
  validateReturnShape(index, detail);
  validateReturnState(index, detail, row);
  validateReturnArithmetic(index, detail, row.consequence as string);
}

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

function validateRateSchedule(rows: readonly StoredRow[]): void {
  const evidence = rows.flatMap((row) => (row.evidence ? [row.evidence] : []));
  const judged = evidence.map((item) => ({ item, verdict: checkRate(item.hsn, item.gst_rate).verdict }));
  const matched = judged.filter((entry) => entry.verdict === "match");
  const mismatched = judged.filter((entry) => entry.verdict === "mismatch");
  const undecided = judged.filter((entry) => entry.verdict !== "match" && entry.verdict !== "mismatch");

  if (undecided.length !== 0) {
    const refs = undecided.map((entry) => `${entry.item.invoice_ref} (${entry.verdict})`).join(", ");
    throw new Error(`data/seed.json: every invoice must get a decisive rate verdict, these did not: ${refs}`);
  }
  if (matched.length !== LAWFUL_RATE_MATCHES) {
    throw new Error(
      `data/seed.json: expected ${LAWFUL_RATE_MATCHES} invoices charged at their lawful rate, found ${matched.length}`,
    );
  }
  if (mismatched.length !== LAWFUL_RATE_MISMATCHES) {
    throw new Error(
      `data/seed.json: expected ${LAWFUL_RATE_MISMATCHES} invoice charged off the schedule, found ${mismatched.length}`,
    );
  }
  for (const entry of mismatched) {
    if (!entry.item.unmatched) {
      throw new Error(
        `data/seed.json: ${entry.item.invoice_ref} is charged off the schedule but the department can see it, so the excess credit is not part of the demand`,
      );
    }
  }
}

function validateReturnLedger(rows: readonly StoredRow[]): void {
  const returns = rows.flatMap((row) => (row.return ? [{ row, detail: row.return }] : []));
  if (returns.length === 0) return;

  const notice = rows.find((row) => row.notice !== undefined)?.notice as SeedNotice;
  const causal = returns.filter((entry) => entry.detail.led_to !== null);

  if (causal.length !== 1) {
    throw new Error(`data/seed.json: expected exactly one return to have produced a notice, found ${causal.length}`);
  }

  const { detail } = causal[0];
  if (!rows.some((row) => row.id === detail.led_to)) {
    throw new Error(`data/seed.json: return led_to ${String(detail.led_to)}, which is not a row in this seed`);
  }
  if (detail.form !== "GSTR-3B" || detail.state !== "filed") {
    throw new Error("data/seed.json: only a filed GSTR-3B can have produced an ITC mismatch notice");
  }

  const links: readonly [string, unknown, unknown][] = [
    ["itc_claimed vs notice claimed_itc", detail.itc_claimed, notice.claimed_itc],
    ["itc_available vs notice matched_itc", detail.itc_available, notice.matched_itc],
    ["period_start vs notice period_start", detail.period_start, notice.period_start],
    ["period_end vs notice period_end", detail.period_end, notice.period_end],
  ];

  for (const [label, actual, expected] of links) {
    if (actual !== expected) {
      throw new Error(`data/seed.json: causal return ${label}, got ${String(actual)}, expected ${String(expected)}`);
    }
  }

  const unfiledMonths = returns
    .filter((entry) => entry.detail.form === "GSTR-3B" && entry.detail.state !== "filed")
    .map((entry) => monthNumber(entry.detail.period_start))
    .sort((a, b) => a - b);
  const hasConsecutiveUnfiled = unfiledMonths.some(
    (month, position) => position > 0 && month - unfiledMonths[position - 1] === 1,
  );
  const claimsEwayBill = returns.some((entry) =>
    EWAY_BILL.test([entry.row.obligation, entry.row.consequence, ...entry.detail.blocks].join("\n")),
  );

  if (claimsEwayBill && !hasConsecutiveUnfiled) {
    throw new Error("data/seed.json: an e-way bill block is claimed without two consecutive unfiled GSTR-3B periods");
  }
  if (hasConsecutiveUnfiled && !claimsEwayBill) {
    throw new Error("data/seed.json: two consecutive GSTR-3B periods are unfiled and the e-way bill block is not stated");
  }
}

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
    if (row.return !== undefined) {
      validateReturn(index, row.return as ReturnDetail, row);
    }
    if ((row.doc_type === "gst_return") !== (row.return !== undefined)) {
      fail(index, "a gst_return row must carry a return object, and only a gst_return row may");
    }

    return row as unknown as StoredRow;
  });

  validateItcReconciliation(rows);
  validateRateSchedule(rows);
  validateReturnLedger(rows);
  return rows;
}

const SEED: readonly StoredRow[] = validateSeed(seedJson);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export interface DocumentStore {
  listDocuments(): Promise<StoredRow[]>;
  getDocument(id: string): Promise<StoredRow | null>;
  insertDocument(row: StoredRow): Promise<StoredRow>;
  updateDocument(id: string, patch: Partial<StoredRow>): Promise<StoredRow | null>;
  reset(): Promise<number>;
}

function createMemoryStore(): DocumentStore {
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

const globalStore = globalThis as typeof globalThis & {
  __nammamsmeStore?: DocumentStore;
};

function createStore(): DocumentStore {
  const url = process.env.DATABASE_URL;
  if (!url) return createMemoryStore();

  return createPgStore(url, SEED);
}

export const db: DocumentStore = (globalStore.__nammamsmeStore ??= createStore());

export function sortByDeadlineAsc(rows: readonly StoredRow[]): StoredRow[] {
  return [...rows].sort((a, b) => {
    if (a.deadline === b.deadline) return 0;
    if (a.deadline === null) return 1;
    if (b.deadline === null) return -1;
    return a.deadline < b.deadline ? -1 : 1;
  });
}
