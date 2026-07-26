import { describe, expect, it } from "vitest";
import type { SeedEvidence, StoredRow } from "./db";
import { assembleEvidence } from "./evidence";

const PERIOD = { periodStart: "2025-04-01", periodEnd: "2025-06-30" };
const NO_NOTICE_TOTALS = { ...PERIOD, claimed_itc: null, matched_itc: 0 };

function baseRow(id: string, doc_date: string | null, deadline: string | null, counterparty: string) {
  return {
    id,
    obligation: `क्रय चालान ${id}`,
    doc_date,
    deadline,
    counterparty,
    consequence: "आईटीसी उलटफेर",
    direction: "owing" as const,
    status: "seeded" as const,
    blockers: [],
    source_ref: null,
    file_url: null,
    created_at: "2026-07-01T00:00:00.000Z",
  };
}

interface InvoiceSpec {
  id: string;
  doc_date: string | null;
  taxable: number;
  gst: number;
  gst_rate: number;
  deadline?: string | null;
  counterparty?: string;
  unmatched?: boolean;
}

/** A purchase invoice as the store actually holds it: gross `amount` + an `evidence` block. */
function invoice(spec: InvoiceSpec): StoredRow {
  const { id, doc_date, taxable, gst, gst_rate } = spec;
  return {
    ...baseRow(id, doc_date, spec.deadline ?? null, spec.counterparty ?? "कुमार टेक्सटाइल्स"),
    role: "evidence",
    doc_type: "supplier_invoice",
    amount: taxable + gst, // gross, exactly as seeded
    evidence: { invoice_ref: `KT/${id}`, taxable, gst, gst_rate, unmatched: spec.unmatched ?? false },
  };
}

/** An invoice with no `evidence` block at all — the derivation fallback path. */
function bareInvoice(id: string, doc_date: string, gross: number): StoredRow {
  return {
    ...baseRow(id, doc_date, null, "अज्ञात आपूर्तिकर्ता"),
    role: "evidence",
    doc_type: "supplier_invoice",
    amount: gross,
  };
}

function obligationRow(id: string, doc_date: string, amount: number): StoredRow {
  return {
    ...baseRow(id, doc_date, doc_date, "राज्य कर विभाग"),
    role: "obligation",
    doc_type: "gst_notice",
    amount,
  };
}

describe("assembleEvidence — candidate selection", () => {
  it("excludes invoices raised outside the notice period", () => {
    const result = assembleEvidence(NO_NOTICE_TOTALS, [
      invoice({ id: "IN", doc_date: "2025-05-14", taxable: 1_500_000, gst: 180_000, gst_rate: 12 }),
      invoice({ id: "EARLY", doc_date: "2025-03-31", taxable: 900_000, gst: 108_000, gst_rate: 12 }),
      invoice({ id: "LATE", doc_date: "2025-07-01", taxable: 900_000, gst: 108_000, gst_rate: 12 }),
    ]);

    expect(result.rows.map((r) => r.invoice_ref)).toEqual(["KT/IN"]);
    expect(result.claimedTotal).toBe(180_000);
  });

  it("includes invoices dated exactly on the period boundaries", () => {
    const result = assembleEvidence(NO_NOTICE_TOTALS, [
      invoice({ id: "START", doc_date: "2025-04-01", taxable: 100_000, gst: 12_000, gst_rate: 12 }),
      invoice({ id: "END", doc_date: "2025-06-30", taxable: 200_000, gst: 24_000, gst_rate: 12 }),
    ]);

    expect(result.rows).toHaveLength(2);
    expect(result.claimedTotal).toBe(36_000);
  });

  it("excludes obligation rows even when they fall inside the period (D-30)", () => {
    const result = assembleEvidence(NO_NOTICE_TOTALS, [
      obligationRow("doc_notice", "2025-05-01", 512_000),
      invoice({ id: "IN", doc_date: "2025-05-14", taxable: 1_500_000, gst: 180_000, gst_rate: 12 }),
    ]);

    expect(result.rows.map((r) => r.invoice_ref)).toEqual(["KT/IN"]);
    expect(result.claimedTotal).toBe(180_000);
  });

  it("filters on doc_date, NOT deadline (D-09)", () => {
    // Both rows flip if `deadline` is used: the in-period invoice is due after the
    // period closes, and the out-of-period one is due inside it.
    const result = assembleEvidence(NO_NOTICE_TOTALS, [
      invoice({ id: "IN", doc_date: "2025-04-08", deadline: "2025-08-08", taxable: 1_500_000, gst: 180_000, gst_rate: 12 }),
      invoice({ id: "OUT", doc_date: "2025-02-15", deadline: "2025-05-01", taxable: 700_000, gst: 84_000, gst_rate: 12 }),
    ]);

    expect(result.rows.map((r) => r.invoice_ref)).toEqual(["KT/IN"]);
    expect(result.claimedTotal).toBe(180_000);
    expect(result.claimedTotal).not.toBe(84_000);
  });

  it("normalises day-first invoice dates before comparing", () => {
    const result = assembleEvidence(NO_NOTICE_TOTALS, [
      invoice({ id: "DDMM", doc_date: "08/04/2025", taxable: 1_500_000, gst: 180_000, gst_rate: 12 }),
    ]);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].doc_date).toBe("2025-04-08");
  });
});

describe("assembleEvidence — taxable and gst come from the row, not a rate guess", () => {
  it("reads stored figures for mixed 5% and 12% invoices", () => {
    const result = assembleEvidence(NO_NOTICE_TOTALS, [
      invoice({ id: "TWELVE", doc_date: "2025-04-08", taxable: 1_500_000, gst: 180_000, gst_rate: 12 }),
      invoice({ id: "FIVE", doc_date: "2025-05-20", taxable: 800_000, gst: 40_000, gst_rate: 5 }),
    ]);

    // Deriving at a flat 18% off the gross would give 1,423,729 and 711,864.
    expect(result.rows.map((r) => r.taxable)).toEqual([1_500_000, 800_000]);
    expect(result.rows.map((r) => r.gst)).toEqual([180_000, 40_000]);
    expect(result.claimedTotal).toBe(220_000);
  });

  it("uses the row's own gst_rate when only the figures are missing", () => {
    const partial = { invoice_ref: "KT/PARTIAL", gst_rate: 5, unmatched: false } as unknown as SeedEvidence;
    const row: StoredRow = { ...bareInvoice("PARTIAL", "2025-04-10", 840_000), evidence: partial };

    const result = assembleEvidence(NO_NOTICE_TOTALS, [row]);

    expect(result.rows[0]).toEqual({
      counterparty: "अज्ञात आपूर्तिकर्ता",
      invoice_ref: "KT/PARTIAL",
      doc_date: "2025-04-10",
      taxable: 800_000,
      gst: 40_000,
    });
  });

  it("falls back to the standard rate only when there is no evidence block", () => {
    const result = assembleEvidence(NO_NOTICE_TOTALS, [bareInvoice("BARE", "2025-04-10", 1_180_000)]);

    expect(result.rows[0].taxable).toBe(1_000_000);
    expect(result.rows[0].gst).toBe(180_000);
    expect(result.rows[0].invoice_ref).toBe("क्रय चालान BARE");
  });
});

describe("assembleEvidence — totals", () => {
  it("sums GST across the surviving rows and derives the gap", () => {
    const result = assembleEvidence({ ...PERIOD, claimed_itc: 600_000, matched_itc: 400_000 }, [
      invoice({ id: "A", doc_date: "2025-04-05", taxable: 2_500_000, gst: 300_000, gst_rate: 12 }),
      invoice({ id: "B", doc_date: "2025-05-05", taxable: 2_000_000, gst: 240_000, gst_rate: 12 }),
      invoice({ id: "C", doc_date: "2025-06-05", taxable: 1_200_000, gst: 60_000, gst_rate: 5 }),
    ]);

    expect(result.claimedTotal).toBe(600_000);
    expect(result.matchedTotal).toBe(400_000);
    expect(result.gap).toBe(200_000);
    expect(result.periodStart).toBe("2025-04-01");
    expect(result.periodEnd).toBe("2025-06-30");
  });

  it("reconciles the locked figures: 14 invoices, ₹18,00,000 claimed, ₹4,00,000 unmatched", () => {
    const invoices = [
      ...Array.from({ length: 10 }, (_, i) =>
        invoice({ id: `INV-${i + 1}`, doc_date: "2025-04-15", taxable: 1_400_000, gst: 168_000, gst_rate: 12 })),
      ...Array.from({ length: 4 }, (_, i) =>
        invoice({ id: `INV-${i + 11}`, doc_date: "2025-05-15", taxable: 600_000, gst: 30_000, gst_rate: 5 })),
    ];

    const result = assembleEvidence({ ...PERIOD, claimed_itc: 1_800_000, matched_itc: 1_400_000 }, invoices);

    expect(result.rows).toHaveLength(14);
    expect(result.claimedTotal).toBe(1_800_000);
    expect(result.matchedTotal).toBe(1_400_000);
    expect(result.gap).toBe(400_000);
  });

  it("falls back to the notice figure when no invoices survive the filter", () => {
    const result = assembleEvidence({ ...PERIOD, claimed_itc: 1_800_000, matched_itc: 1_400_000 }, [
      invoice({ id: "OLD", doc_date: "2024-01-01", taxable: 100_000, gst: 12_000, gst_rate: 12 }),
    ]);

    expect(result.rows).toEqual([]);
    expect(result.claimedTotal).toBe(1_800_000);
    expect(result.gap).toBe(400_000);
  });
});

describe("assembleEvidence — row shape", () => {
  it("carries the counterparty and the stored invoice reference", () => {
    const result = assembleEvidence(NO_NOTICE_TOTALS, [
      invoice({
        id: "0142",
        doc_date: "2025-04-08",
        taxable: 1_500_000,
        gst: 180_000,
        gst_rate: 12,
        counterparty: "वर्मा हौज़री",
      }),
    ]);

    expect(result.rows[0]).toEqual({
      counterparty: "वर्मा हौज़री",
      invoice_ref: "KT/0142",
      doc_date: "2025-04-08",
      taxable: 1_500_000,
      gst: 180_000,
    });
  });
});
