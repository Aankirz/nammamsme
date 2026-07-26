import type { RateVerdict } from "@/lib/rates";
import { formatDateShort } from "@/components/lib/copy";
import { formatRupees, inRupees } from "@/components/lib/money";
import {
  codeOf,
  consequenceOf,
  percent,
  restraintNote,
  scheduleNote,
  spokenVerdict,
  type InvoiceRate,
  type RateIndex,
} from "@/components/lib/rate";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";

export interface EvidenceRow {
  counterparty: string;
  invoice_ref: string;
  doc_date: string;
  taxable: number;
  gst: number;
}

export interface ReplyDraft {
  rows: EvidenceRow[];
  claimedTotal: number;
  matchedTotal: number;
  gap: number;
  statements: string[];
}

export type DraftLoad = "loading" | "ready" | "failed";

const SKELETON_ROWS = 5;

const VERDICT_TAG: Record<RateVerdict, string> = {
  match: "tag-neutral",
  mismatch: "",
  ambiguous: "tag-outline",
  unknown: "tag-neutral",
};

const HEADINGS = [
  { label: "Bill no.", align: "text-left" },
  { label: "Supplier", align: "text-left" },
  { label: "Invoice date", align: "text-left" },
  { label: "HSN", align: "text-left" },
  { label: "Rate charged", align: "text-left" },
  { label: "GST on it", align: "text-right" },
];

function RateCell({ rate }: { rate: InvoiceRate | undefined }) {
  if (!rate) {
    return (
      <td className="text-[11px] opacity-45">not checked</td>
    );
  }

  const { check } = rate;
  const note = scheduleNote(check);
  const mismatch = check.verdict === "mismatch";

  return (
    <td>
      <span
        className={`tag numerals text-[10px] tracking-[0.06em] ${VERDICT_TAG[check.verdict]}`}
        style={
          mismatch
            ? { backgroundColor: "var(--stamp-tint)", color: "var(--stamp)" }
            : undefined
        }
      >
        {percent(check.charged)}
      </span>
      <span className="sr-only">, {spokenVerdict(check.verdict)}</span>
      {note && (
        <span className={`block text-[11px] ${mismatch ? "text-stamp" : "opacity-45"}`}>
          {note}
        </span>
      )}
    </td>
  );
}

function Total({
  label,
  amount,
  tinted = false,
}: {
  label: string;
  amount: number;
  tinted?: boolean;
}) {
  return (
    <div
      className="border-r border-rule px-[var(--space-6)] py-[var(--space-4)] last:border-r-0"
      style={tinted ? { backgroundColor: "var(--color-accent-100)" } : undefined}
    >
      <Kicker style={{ letterSpacing: "0.14em", opacity: tinted ? 0.6 : 0.5 }}>
        {label}
      </Kicker>
      <p
        className={`numerals font-[family-name:var(--font-heading)] text-[26px] leading-[1.1] font-semibold ${
          tinted ? "text-[var(--color-accent-800)]" : ""
        }`}
      >
        {formatRupees(amount)}
      </p>
    </div>
  );
}

interface EvidenceTableProps {
  load: DraftLoad;
  draft: ReplyDraft | null;
  rates: RateIndex;
}

export function EvidenceTable({ load, draft, rates }: EvidenceTableProps) {
  const rows = draft?.rows ?? [];

  const overcharged = rows.flatMap((row) => {
    const rate = rates[row.invoice_ref];
    return rate && rate.check.verdict === "mismatch"
      ? [{ supplier: row.counterparty, rate }]
      : [];
  });

  const unsettled = rows.filter((row) => {
    const verdict = rates[row.invoice_ref]?.check.verdict;
    return verdict === "ambiguous" || verdict === "unknown";
  }).length;

  return (
    <section aria-labelledby="evidence-heading">
      <div className="mb-[var(--space-3)] flex items-baseline justify-between gap-4">
        <Kicker as="h2" id="evidence-heading">
          The reply is built from bills you already have
        </Kicker>
        <span className="text-[11px] opacity-45">
          {load === "ready"
            ? `${rows.length} purchase bills · filtered on invoice date, not payment date`
            : "Gathering the purchase bills already in this file"}
        </span>
      </div>

      <Blueprint>
        <div className="max-h-[290px] overflow-auto">
          <table className="table text-[12.5px]">
            <thead>
              <tr>
                {HEADINGS.map(({ label, align }) => (
                  <th key={label} scope="col" className={align}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {load === "loading"
                ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                    <tr key={index}>
                      {HEADINGS.map(({ label }) => (
                        <td key={label}>
                          <span className="block h-3 w-full bg-[var(--color-surface)]" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row, index) => {
                    const rate = rates[row.invoice_ref];
                    const flagged = rate?.check.verdict === "mismatch";

                    return (
                      <tr
                        key={row.invoice_ref || index}
                        data-verdict={rate?.check.verdict ?? "unknown"}
                      >
                        <td className="numerals opacity-70">{row.invoice_ref}</td>
                        <td className={flagged ? "font-semibold text-stamp" : ""}>
                          {row.counterparty}
                        </td>
                        <td className="numerals opacity-70">
                          {formatDateShort(row.doc_date) ?? "no date"}
                        </td>
                        <td className="numerals opacity-70">
                          {rate ? codeOf(rate.check) : "none"}
                        </td>
                        <RateCell rate={rate} />
                        <td
                          className={`numerals text-right font-semibold ${
                            flagged ? "text-stamp" : ""
                          }`}
                        >
                          {formatRupees(row.gst)}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {load === "ready" && draft && rows.length > 0 && (
          <div className="grid grid-cols-3 border-t border-ink">
            <Total label="Attached in support" amount={draft.claimedTotal} />
            <Total label="Confirmed by the department" amount={draft.matchedTotal} />
            <Total label="Unmatched, stated openly" amount={draft.gap} tinted />
          </div>
        )}
      </Blueprint>

      {load === "ready" && rows.length === 0 && (
        <p className="mt-[var(--space-3)] text-[12.5px] opacity-60">
          No supporting invoices are in this file yet. The reply will be filed on its
          own facts.
        </p>
      )}

      {load === "failed" && (
        <p className="mt-[var(--space-3)] text-[12.5px] text-stamp">
          The supporting invoices could not be read just now. Filing is still possible,
          but the reply would go without them.
        </p>
      )}

      {load === "ready" &&
        draft &&
        draft.statements.map((statement, index) => (
          <p
            key={index}
            className="mt-[var(--space-3)] max-w-[80ch] text-[12.5px] opacity-60 [text-wrap:pretty]"
          >
            {inRupees(statement)}
          </p>
        ))}

      {load === "ready" &&
        overcharged.map(({ supplier, rate }) => (
          <div
            key={rate.invoiceRef}
            className="mt-[var(--space-4)] border border-stamp-rule px-[var(--space-4)] py-[var(--space-3)]"
          >
            <Kicker style={{ color: "var(--stamp)", opacity: 1 }}>One rate does not hold</Kicker>
            <p className="mt-1.5 max-w-[80ch] text-[12.5px] [text-wrap:pretty]">
              {consequenceOf(rate, supplier)}
            </p>
            {rate.check.description && (
              <p className="mt-1.5 max-w-[80ch] text-[12.5px] opacity-60">
                The schedule reads {rate.check.matchedCode} as {rate.check.description}.
              </p>
            )}
          </div>
        ))}

      {load === "ready" && unsettled > 0 && (
        <p className="mt-[var(--space-3)] max-w-[80ch] text-[12.5px] opacity-60">
          {restraintNote(unsettled)}
        </p>
      )}
    </section>
  );
}
