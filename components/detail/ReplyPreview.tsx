"use client";

import { useEffect, useState } from "react";
import { formatDateShort } from "@/components/lib/copy";
import { formatRupees } from "@/components/lib/money";

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
      {Array.from({ length: 5 }, (_, index) => (
        <tr key={index} className="border-b border-rule">
          <td className="py-2">
            <span className="block h-3 w-40 rounded-sm bg-paper-sunk" />
          </td>
          <td className="py-2">
            <span className="block h-3 w-20 rounded-sm bg-paper-sunk" />
          </td>
          <td className="py-2 text-right">
            <span className="ml-auto block h-3 w-24 rounded-sm bg-paper-sunk" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

interface ReplyPreviewProps {
  documentId: string;
  filing: boolean;
  onFile: () => void;
  onCancel: () => void;
}

/**
 * What is about to be filed, before it is filed.
 *
 * The reply is not a form fill: it is assembled from purchase invoices already
 * in this file. They arrive one after another because that sequence is the
 * argument, and it is the only animation in the product that earns itself.
 */
export function ReplyPreview({ documentId, filing, onFile, onCancel }: ReplyPreviewProps) {
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

  return (
    <div className="border-t border-rule pt-4">
      <h3 className="eyebrow">Reply to be filed</h3>

      <p className="mt-2 max-w-[62ch] text-sm text-ink">
        {load === "ready"
          ? `The reply attaches the ${rows.length} purchase invoices already in this file and states what they add up to.`
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

      <div className="mt-4 max-h-56 overflow-y-auto overscroll-contain">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-paper-raised">
            <tr className="border-b border-rule-strong text-left">
              <th scope="col" className="eyebrow py-2 font-semibold">
                Supplier
              </th>
              <th scope="col" className="eyebrow py-2 font-semibold">
                Invoice
              </th>
              <th scope="col" className="eyebrow py-2 font-semibold">
                Dated
              </th>
              <th scope="col" className="eyebrow py-2 text-right font-semibold">
                GST claimed
              </th>
            </tr>
          </thead>

          {load === "loading" ? (
            <SkeletonRows />
          ) : (
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.invoice_ref || index}
                  className="ledger-in border-b border-rule"
                  style={{ animationDelay: `${index * STAGGER_MS}ms` }}
                >
                  <td className="py-2 pr-3 text-ink">{row.counterparty}</td>
                  <td className="numerals py-2 pr-3 font-mono text-xs text-ink-muted">
                    {row.invoice_ref}
                  </td>
                  <td className="numerals py-2 pr-3 font-mono text-xs text-ink-muted">
                    {formatDateShort(row.doc_date) ?? "no date"}
                  </td>
                  <td className="numerals py-2 text-right font-mono text-ink">
                    {formatRupees(row.gst)}
                  </td>
                </tr>
              ))}
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
          className="rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-invert transition-[opacity,transform] duration-150 ease-[var(--ease-out)] hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {filing ? "Filing" : "File this reply"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={filing}
          className="rounded-md border border-rule px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 ease-[var(--ease-out)] hover:border-ink hover:bg-paper-sunk active:bg-rule disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}
