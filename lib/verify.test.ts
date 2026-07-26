import { describe, expect, it } from "vitest";
import type { DigitiseBlock, DigitiseResult, ExtractResult } from "./types";
import { verifyExtraction } from "./verify";
import { normaliseAmount, normaliseDate } from "./normalise";

const extract = (fields: Record<string, string | null>): ExtractResult => ({ fields });

const digitise = (blocks: Array<Pick<DigitiseBlock, "page" | "text">>): DigitiseResult => ({
  blocks: blocks.map((b, block) => ({ page: b.page, block, text: b.text })),
  text: blocks.map((b) => b.text).join("\n"),
});

const onePage = (text: string): DigitiseResult => digitise([{ page: 1, text }]);

/** The real notice, with every locked figure present. */
const LOCKED_NOTICE_TEXT = [
  "FORM GST DRC-01",
  "Show cause notice under section 73 of the CGST Act.",
  "Input tax credit claimed: Rs. 18,00,000",
  "Credit matched against supplier returns: Rs. 14,00,000",
  "Tax: Rs. 4,00,000",
  "Interest: Rs. 72,000",
  "Penalty: Rs. 40,000",
  "Total payable: Rs. 5,12,000/-",
  "Reply by 14/08/2026.",
].join("\n");

const LOCKED_FIELDS: Record<string, string | null> = {
  amount: "₹5,12,000/-",
  tax: "₹4,00,000",
  interest: "₹72,000",
  penalty: "₹40,000",
  claimed_itc: "₹18,00,000",
  matched_itc: "₹14,00,000",
  doc_date: "15 July 2026",
  deadline: "14/08/2026",
  counterparty: "Deputy Commissioner, State Tax",
  section: "73",
};

describe("normaliseAmount", () => {
  it("treats every Indian rupee spelling of 512000 as the same number", () => {
    const spellings = ["₹5,12,000/-", "Rs. 5,12,000", "5,12,000.00", "512000", 512000];
    for (const spelling of spellings) {
      expect(normaliseAmount(spelling)).toBe(512000);
    }
  });

  it("returns null for empty or unparseable input", () => {
    expect(normaliseAmount("")).toBeNull();
    expect(normaliseAmount("   ")).toBeNull();
    expect(normaliseAmount("not a number")).toBeNull();
    expect(normaliseAmount(null)).toBeNull();
    expect(normaliseAmount(undefined)).toBeNull();
  });
});

describe("normaliseDate", () => {
  it("reads ambiguous numeric dates day-first, per Indian convention", () => {
    expect(normaliseDate("14/08/2026")).toBe("2026-08-14");
    expect(normaliseDate("14-08-2026")).toBe("2026-08-14");
    expect(normaliseDate("14 August 2026")).toBe("2026-08-14");
    expect(normaliseDate("2026-08-14")).toBe("2026-08-14");
  });

  it("returns null for unparseable input", () => {
    expect(normaliseDate("sometime next month")).toBeNull();
    expect(normaliseDate("31/02/2026")).toBeNull();
    expect(normaliseDate(null)).toBeNull();
  });
});

describe("verifyExtraction — false refusals", () => {
  it("does NOT block when the two passes write the same number differently", () => {
    const result = verifyExtraction(
      extract({ amount: "₹5,12,000/-", deadline: "14/08/2026" }),
      onePage("Total payable 5,12,000 rupees. Reply by 14/08/2026."),
    );

    expect(result.blockers).toEqual([]);
    expect(result.canFile).toBe(true);
    expect(result.fields.amount).toBe(512000);
  });

  it("passes the locked notice cleanly", () => {
    const result = verifyExtraction(extract(LOCKED_FIELDS), onePage(LOCKED_NOTICE_TEXT));

    expect(result.blockers).toEqual([]);
    expect(result.flags).toEqual([]);
    expect(result.canFile).toBe(true);
    expect(result.fields.tax! + result.fields.interest! + result.fields.penalty!).toBe(512000);
    expect(result.fields.deadline).toBe("2026-08-14");
    expect(result.fields.doc_date).toBe("2026-07-15");
  });
});

describe("verifyExtraction — genuine disagreement", () => {
  it("blocks when the digitise pass never mentions the extracted figure", () => {
    const result = verifyExtraction(
      extract({ amount: "₹5,12,000", deadline: "14/08/2026" }),
      onePage("Total payable Rs. 4,00,000 only. Reply by 14/08/2026."),
    );

    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0].kind).toBe("amount_disagreement");
    expect(result.blockers[0].field).toBe("amount");
    expect(result.canFile).toBe(false);
  });
});

describe("verifyExtraction — annexures", () => {
  const fields = { amount: "₹5,12,000", deadline: "14/08/2026" };

  it("blocks when the notice points at an annexure we do not hold", () => {
    const result = verifyExtraction(
      extract(fields),
      onePage("The demand of Rs. 5,12,000 is computed as per Annexure A. Reply by 14/08/2026."),
    );

    expect(result.blockers.map((b) => b.kind)).toEqual(["missing_annexure"]);
    expect(result.canFile).toBe(false);
  });

  it("does not block when the annexure body is on a later page", () => {
    const result = verifyExtraction(
      extract(fields),
      digitise([
        { page: 1, text: "The demand of Rs. 5,12,000 is computed as per Annexure A. Reply by 14/08/2026." },
        { page: 2, text: "Annexure A\nUnmatched invoices: 3 invoices, Rs. 4,00,000." },
      ]),
    );

    expect(result.blockers).toEqual([]);
    expect(result.canFile).toBe(true);
  });
});

describe("verifyExtraction — required fields", () => {
  it("blocks when the reply-by date could not be established", () => {
    const result = verifyExtraction(
      extract({ amount: "₹5,12,000" }),
      onePage("Total payable Rs. 5,12,000."),
    );

    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0].kind).toBe("missing_field");
    expect(result.blockers[0].field).toBe("deadline");
    expect(result.canFile).toBe(false);
  });
});

describe("verifyExtraction — arithmetic", () => {
  const withTotal = (total: string, textTotal: string) =>
    verifyExtraction(
      extract({
        amount: total,
        tax: "₹4,00,000",
        interest: "₹72,000",
        penalty: "₹40,000",
        deadline: "14/08/2026",
      }),
      onePage(
        `Tax Rs. 4,00,000 Interest Rs. 72,000 Penalty Rs. 40,000 Total ${textTotal}. Reply by 14/08/2026.`,
      ),
    );

  it("ignores a rounding-scale difference of ₹50", () => {
    const result = withTotal("₹5,12,050", "Rs. 5,12,050");

    expect(result.flags).toEqual([]);
    expect(result.blockers).toEqual([]);
    expect(result.canFile).toBe(true);
  });

  it("flags a ₹5,000 difference but still allows filing", () => {
    const result = withTotal("₹5,17,000", "Rs. 5,17,000");

    expect(result.flags).toHaveLength(1);
    expect(result.flags[0].kind).toBe("arithmetic_mismatch");
    expect(result.flags[0].expected).toBe(512000);
    expect(result.flags[0].actual).toBe(517000);
    expect(result.blockers).toEqual([]);
    expect(result.canFile).toBe(true);
  });
});
