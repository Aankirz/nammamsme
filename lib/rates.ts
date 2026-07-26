import RATES from "../data/rates/gst-rates.json";

export interface RateEntry {
  code: string;
  kind: "goods" | "services";
  rates: Array<{ rate: number; desc: string }>;
}

export type RateVerdict = "match" | "mismatch" | "ambiguous" | "unknown";

export interface RateCheck {
  verdict: RateVerdict;
  hsn: string;
  charged: number | null;
  matchedCode: string | null;
  expected: number[];
  description: string | null;
  detail: string;
}

const TABLE = RATES as RateEntry[];
const BY_CODE = new Map(TABLE.map((entry) => [entry.code, entry]));
const MIN_CODE_LENGTH = 4;

export function normaliseHsn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^0-9]/g, "");
  return digits.length >= MIN_CODE_LENGTH ? digits : null;
}

export function lookupRate(rawHsn: string | null | undefined): RateEntry | null {
  const hsn = normaliseHsn(rawHsn);
  if (!hsn) return null;

  for (let length = hsn.length; length >= MIN_CODE_LENGTH; length--) {
    const found = BY_CODE.get(hsn.slice(0, length));
    if (found) return found;
  }

  return null;
}

export function checkRate(
  rawHsn: string | null | undefined,
  charged: number | null | undefined,
): RateCheck {
  const hsn = normaliseHsn(rawHsn);
  const chargedRate = typeof charged === "number" && isFinite(charged) ? charged : null;

  if (!hsn) {
    return {
      verdict: "unknown",
      hsn: String(rawHsn ?? ""),
      charged: chargedRate,
      matchedCode: null,
      expected: [],
      description: null,
      detail: "No HSN code was read from this invoice, so the rate cannot be checked.",
    };
  }

  const entry = lookupRate(hsn);
  if (!entry) {
    return {
      verdict: "unknown",
      hsn,
      charged: chargedRate,
      matchedCode: null,
      expected: [],
      description: null,
      detail: `HSN ${hsn} is not in the rate schedule we hold. We will not guess a rate for it.`,
    };
  }

  const expected = entry.rates.map((r) => r.rate);
  const description = entry.rates[0]?.desc ?? null;

  if (chargedRate === null) {
    return {
      verdict: "unknown",
      hsn,
      charged: null,
      matchedCode: entry.code,
      expected,
      description,
      detail: "No rate was read from this invoice, so there is nothing to compare.",
    };
  }

  if (expected.length > 1) {
    return {
      verdict: "ambiguous",
      hsn,
      charged: chargedRate,
      matchedCode: entry.code,
      expected,
      description,
      detail: `HSN ${entry.code} carries more than one rate (${expected.join("% or ")}%) depending on conditions such as sale value. We cannot say this ${chargedRate}% is wrong without the condition.`,
    };
  }

  if (expected[0] === chargedRate) {
    return {
      verdict: "match",
      hsn,
      charged: chargedRate,
      matchedCode: entry.code,
      expected,
      description,
      detail: `Charged at ${chargedRate}%, which matches the schedule for HSN ${entry.code}.`,
    };
  }

  return {
    verdict: "mismatch",
    hsn,
    charged: chargedRate,
    matchedCode: entry.code,
    expected,
    description,
    detail: `Charged at ${chargedRate}%. The schedule puts HSN ${entry.code} at ${expected[0]}%. A wrong rate here is what becomes an input tax credit mismatch, and then a notice.`,
  };
}
