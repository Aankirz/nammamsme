"use client";

import { useEffect, useState } from "react";
import type { RateVerdict } from "@/lib/rates";
import { formatDateShort } from "@/components/lib/copy";
import { formatRupees } from "@/components/lib/money";
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
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/ui/buttons";

interface EvidenceRow {
  counterparty: string;
  invoice_ref: string;
  doc_date: string;
  taxable: number;
  gst: number;
}

interface ReplyDraft {
  rows: EvidenceRow[];
  claimedTotal: number;
  matchedTotal: number;
  gap: number;
  statements: string[];
}

type Load = "loading" | "ready" | "failed";

const STAGGER_MS = 40;
const SKELETON_ROWS = 5;

function toDraft(payload: unknown): ReplyDraft | null {
  if (typeof payload !== "object" || payload === null) return null;

  const draft = payload as Record<string, unknown>;
  const evidence = draft.evidence as Record<string, unknown> | undefined;
  if (!evidence || !Array.isArray(evidence.rows)) return null;

  const rows = evidence.rows.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const row = value as Record<string, unknown>;
    return [
      {
        counterparty: typeof row.counterparty === "string" ? row.counterparty : "",
        invoice_ref: typeof row.invoice_ref === "string" ? row.invoice_ref : "",
        doc_date: typeof row.doc_date === "string" ? row.doc_date : "",
        taxable: typeof row.taxable === "number" ? row.taxable : 0,
        gst: typeof row.gst === "number" ? row.gst : 0,
      },
    ];
  });

  return {
    rows,
    claimedTotal: typeof evidence.claimedTotal === "number" ? evidence.claimedTotal : 0,
    matchedTotal: typeof evidence.matchedTotal === "number" ? evidence.matchedTotal : 0,
    gap: typeof evidence.gap === "number" ? evidence.gap : 0,
    statements: Array.isArray(draft.statements)
      ? draft.statements.filter((s): s is string => typeof s === "string")
      : [],
  };
}

function SkeletonRows() {
  return (
    <tbody>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <tr key={index} className="border-b border-rule">
          <td className="py-2">
            <span className="block h-3 w-40 rounded-sm bg-paper-sunk" />
          </td>
          <td className="py-2">
            <span className="block h-3 w-20 rounded-sm bg-paper-sunk" />
          </td>
          <td className="py-2">
            <span className="block h-3 w-12 rounded-sm bg-paper-sunk" />
          </td>
          <td className="py-2">
            <span className="block h-3 w-20 rounded-sm bg-paper-sunk" />
          </td>
          <td className="py-2 text-right">
            <span className="ml-auto block h-3 w-10 rounded-sm bg-paper-sunk" />
          </td>
          <td className="py-2 text-right">
            <span className="ml-auto block h-3 w-24 rounded-sm bg-paper-sunk" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

const HEADINGS = [
  { label: "Supplier", align: "" },
  { label: "Invoice", align: "" },
  { label: "HSN", align: "" },
  { label: "Dated", align: "" },
  { label: "Rate", align: "pr-6 text-right" },
  { label: "GST claimed", align: "text-right" },
];

const RATE_TEXT: Record<RateVerdict, string> = {
  match: "text-ink-muted",
  mismatch: "font-semibold text-stamp",
  ambiguous: "text-ink",
  unknown: "text-ink-muted",
};

function RateCell({ rate }: { rate: InvoiceRate | undefined }) {
  if (!rate) {
    return (
      <td className="numerals py-2 pr-6 text-right font-mono text-xs text-ink-faint">
        not checked
      </td>
    );
  }

  const { check } = rate;
  const note = scheduleNote(check);

  return (
    <td className="numerals py-2 pr-6 text-right font-mono text-xs">
      <span className={RATE_TEXT[check.verdict]}>{percent(check.charged)}</span>
      <span className="sr-only">, {spokenVerdict(check.verdict)}</span>
      {note && (
        <span
          className={`block font-sans text-xs ${
            check.verdict === "mismatch" ? "text-stamp" : "text-ink-faint"
          }`}
        >
          {note}
        </span>
      )}
    </td>
  );
}

interface ReplyPreviewProps {
  documentId: string;
  filing: boolean;
  rates: RateIndex;
  onFile: () => void;
  onCancel: () => void;
}

export function ReplyPreview({
  documentId,
  filing,
  rates,
  onFile,
  onCancel,
}: ReplyPreviewProps) {
  const [load, setLoad] = useState<Load>("loading");
  const [draft, setDraft] = useState<ReplyDraft | null>(null);

  useEffect(() => {
    let live = true;

    async function read() {
      try {
        const response = await fetch(`/api/reply/${documentId}`, {
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error(String(response.status));

        const parsed = toDraft(await response.json());
        if (!live) return;
        if (!parsed) {
          setLoad("failed");
          return;
        }

        setDraft(parsed);
        setLoad("ready");
      } catch {
        if (live) setLoad("failed");
      }
    }

    void read();
    return () => {
      live = false;
    };
  }, [documentId]);

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
    <div className="border-t border-rule pt-4">
      <h3 className="eyebrow">Reply to be filed</h3>

      <p className="mt-2 max-w-[62ch] text-sm text-ink">
        {load === "ready"
          ? `The reply attaches the ${rows.length} purchase invoices already in this file, states what they add up to, and checks each rate against the schedule.`
          : "Gathering the purchase invoices already in this file."}
      </p>

      {load === "ready" && draft && draft.statements.length > 0 && (
        <ul className="mt-4 max-w-[62ch] space-y-2 border-l-0">
          {draft.statements.map((statement, index) => (
            <li
              key={index}
              className="ledger-in text-sm leading-relaxed text-ink"
              style={{ animationDelay: `${index * STAGGER_MS}ms` }}
            >
              {statement}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              {HEADINGS.map(({ label, align }) => (
                <th
                  key={label}
                  scope="col"
                  className={`eyebrow border-b border-rule-strong bg-paper-raised py-2 font-semibold ${align}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          {load === "loading" ? (
            <SkeletonRows />
          ) : (
            <tbody>
              {rows.map((row, index) => {
                const rate = rates[row.invoice_ref];
                const flagged = rate?.check.verdict === "mismatch";

                return (
                  <tr
                    key={row.invoice_ref || index}
                    data-verdict={rate?.check.verdict ?? "unknown"}
                    className={`ledger-in border-b ${
                      flagged ? "border-stamp-rule bg-stamp-tint" : "border-rule"
                    }`}
                    style={{ animationDelay: `${index * STAGGER_MS}ms` }}
                  >
                    <td
                      className={`py-2 pr-3 ${flagged ? "font-semibold text-stamp" : "text-ink"}`}
                    >
                      {row.counterparty}
                    </td>
                    <td className="numerals py-2 pr-3 font-mono text-xs text-ink-muted">
                      {row.invoice_ref}
                    </td>
                    <td className="numerals py-2 pr-3 font-mono text-xs text-ink-muted">
                      {rate ? codeOf(rate.check) : "none"}
                    </td>
                    <td className="numerals py-2 pr-3 font-mono text-xs text-ink-muted">
                      {formatDateShort(row.doc_date) ?? "no date"}
                    </td>
                    <RateCell rate={rate} />
                    <td
                      className={`numerals py-2 text-right font-mono ${
                        flagged ? "font-semibold text-stamp" : "text-ink"
                      }`}
                    >
                      {formatRupees(row.gst)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {load === "ready" && rows.length === 0 && (
        <p className="mt-3 text-sm text-ink-muted">
          No supporting invoices are in this file yet. The reply will be filed on its
          own facts.
        </p>
      )}

      {load === "failed" && (
        <p className="mt-3 text-sm text-stamp">
          The supporting invoices could not be read just now. Filing is still possible,
          but the reply would go without them.
        </p>
      )}

      {load === "ready" &&
        overcharged.map(({ supplier, rate }) => (
          <div
            key={rate.invoiceRef}
            className="mt-4 rounded-sm border border-stamp-rule bg-stamp-tint px-4 py-3"
          >
            <p className="eyebrow text-stamp">One rate does not hold</p>
            <p className="mt-1.5 max-w-[62ch] text-sm text-ink">
              {consequenceOf(rate, supplier)}
            </p>
            {rate.check.description && (
              <p className="mt-1.5 max-w-[62ch] text-sm text-ink-muted">
                The schedule reads {rate.check.matchedCode} as {rate.check.description}.
              </p>
            )}
          </div>
        ))}

      {load === "ready" && unsettled > 0 && (
        <p className="mt-3 max-w-[62ch] text-sm text-ink-muted">
          {restraintNote(unsettled)}
        </p>
      )}

      {load === "ready" && draft && rows.length > 0 && (
        <dl className="mt-3 border-t border-rule-strong pt-3 text-sm">
          <div className="flex items-baseline justify-between py-1">
            <dt className="text-ink-muted">Attached in support</dt>
            <dd className="numerals font-mono font-semibold text-ink">
              {formatRupees(draft.claimedTotal)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between py-1">
            <dt className="text-ink-muted">Confirmed by the department</dt>
            <dd className="numerals font-mono text-ink">{formatRupees(draft.matchedTotal)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-rule pt-2 text-stamp">
            <dt className="font-semibold">Unmatched, stated openly</dt>
            <dd className="numerals font-mono font-semibold">{formatRupees(draft.gap)}</dd>
          </div>
        </dl>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onFile}
          disabled={filing}
          className={PRIMARY_BUTTON}
        >
          {filing ? "Filing" : "File this reply"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={filing}
          className={SECONDARY_BUTTON}
        >
          Back
        </button>
      </div>
    </div>
  );
}
