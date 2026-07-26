import { checkRate } from "@/lib/rates";
import { purchaseInvoices, type DocumentRow } from "./documents";
import type { RateIndex } from "./rate";

export function indexRates(rows: readonly DocumentRow[]): RateIndex {
  return Object.fromEntries(
    purchaseInvoices(rows).flatMap((row) => {
      const facts = row.evidence;
      if (facts === null) return [];

      return [
        [
          facts.invoiceRef,
          {
            invoiceRef: facts.invoiceRef,
            goods: facts.goods,
            check: checkRate(facts.hsn, facts.gstRate),
          },
        ] as const,
      ];
    }),
  );
}
