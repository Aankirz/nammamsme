import { describe, expect, it } from "vitest";
import { classifyDocType } from "./classify";

describe("classifyDocType", () => {
  it("recognises a DRC-01 demand notice", () => {
    const text = [
      "FORM GST DRC-01",
      "Show cause notice under section 73 of the CGST Act, 2017.",
      "Input tax credit of Rs. 18,00,000 appears to have been wrongly availed.",
    ].join("\n");

    expect(classifyDocType(text)).toBe("gst_notice");
  });

  it("recognises a supplier invoice", () => {
    const text = [
      "TAX INVOICE",
      "Invoice No: SHT/2026/0114        Date: 14/02/2026",
      "HSN 7308 | Steel fabrication | Rs. 1,00,000 + 18% = Rs. 1,18,000",
    ].join("\n");

    expect(classifyDocType(text)).toBe("supplier_invoice");
  });

  it("recognises a licence or registration certificate", () => {
    const text = [
      "FSSAI Registration Certificate",
      "Licence No: 12420030000123",
      "Valid until 31/03/2027",
    ].join("\n");

    expect(classifyDocType(text)).toBe("licence");
  });

  it("defaults to gst_notice when nothing matches", () => {
    expect(classifyDocType("")).toBe("gst_notice");
    expect(classifyDocType("A blurry photograph of a wall.")).toBe("gst_notice");
  });
});
