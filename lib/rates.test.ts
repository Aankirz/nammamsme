import { describe, expect, test } from "vitest";
import { checkRate, lookupRate, normaliseHsn } from "./rates";

describe("normaliseHsn", () => {
  test("strips separators and keeps digits", () => {
    expect(normaliseHsn("5208.11.90")).toBe("52081190");
    expect(normaliseHsn(" 5205 ")).toBe("5205");
  });

  test("rejects codes shorter than four digits", () => {
    expect(normaliseHsn("61")).toBeNull();
    expect(normaliseHsn("")).toBeNull();
    expect(normaliseHsn(null)).toBeNull();
  });
});

describe("lookupRate", () => {
  test("finds an exact code", () => {
    expect(lookupRate("5205")?.code).toBe("5205");
  });

  test("falls back to the longest matching prefix", () => {
    const found = lookupRate("52081190");
    expect(found).not.toBeNull();
    expect("52081190".startsWith(found!.code)).toBe(true);
  });

  test("returns null rather than guessing on an unknown code", () => {
    expect(lookupRate("88889999")).toBeNull();
  });
});

describe("checkRate", () => {
  test("confirms a correct rate", () => {
    const result = checkRate("5205", 5);
    expect(result.verdict).toBe("match");
    expect(result.expected).toEqual([5]);
  });

  test("flags a wrong rate and names the expected one", () => {
    const result = checkRate("5205", 12);
    expect(result.verdict).toBe("mismatch");
    expect(result.expected).toEqual([5]);
    expect(result.detail).toContain("5%");
  });

  test("refuses to assert when the code carries several rates", () => {
    const result = checkRate("0402", 5);
    expect(result.verdict).toBe("ambiguous");
    expect(result.expected.length).toBeGreaterThan(1);
  });

  test("refuses on an unknown code instead of defaulting", () => {
    const result = checkRate("88889999", 18);
    expect(result.verdict).toBe("unknown");
    expect(result.expected).toEqual([]);
  });

  test("refuses when no rate was read from the invoice", () => {
    expect(checkRate("5205", null).verdict).toBe("unknown");
  });

  test("refuses when no HSN was read", () => {
    expect(checkRate(null, 12).verdict).toBe("unknown");
  });
});
