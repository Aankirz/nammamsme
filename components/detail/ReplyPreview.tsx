"use client";

import { useEffect, useState } from "react";
import { formatDateShort } from "@/components/lib/copy";
import { formatRupees, hasAmount } from "@/components/lib/money";

/** Only the shared columns are read, so a change to the seed cannot break this. */
interface EvidenceRow {
  id: string;
  counterparty: string;
  doc_date: string | null;
  amount: number | null;
}

type Load = "loading" | "ready" | "failed";

const STAGGER_MS = 40;

function toEvidenceRows(payload: unknown): EvidenceRow[] {
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];

    const row = value as Record<string, unknown>;
    if (typeof row.id !== "string") return [];

    return [
      {
        id: row.id,
        counterparty: typeof row.counterparty === "string" ? row.counterparty : "",
        doc_date: typeof row.doc_date === "string" ? row.doc_date : null,
        amount: typeof row.amount === "number" ? row.amount : null,
      },
    ];
  });
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
export function ReplyPreview({ filing, onFile, onCancel }: ReplyPreviewProps) {
  const [load, setLoad] = useState<Load>("loading");
  const [rows, setRows] = useState<EvidenceRow[]>([]);

  useEffect(() => {
    let live = true;

    async function read() {
      try {
        const response = await fetch("/api/documents?role=evidence", {
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error(String(response.status));

        const parsed = toEvidenceRows(await response.json());
        if (!live) return;

        setRows(parsed);
        setLoad("ready");
      } catch {
        if (live) setLoad("failed");
      }
    }

    void read();
    return () => {
      live = false;
    };
  }, []);

  const total = rows.reduce(
    (sum, row) => (hasAmount(row.amount) ? sum + row.amount : sum),
    0,
  );

  return (
    <div className="border-t border-rule pt-4">
      <h3 className="eyebrow">Reply to be filed</h3>

      <p className="mt-2 max-w-[62ch] text-sm text-ink">
        {load === "ready"
          ? `The reply attaches the ${rows.length} purchase invoices already in this file and states what they add up to.`
          : "Gathering the purchase invoices already in this file."}
      </p>

      <div className="mt-4 max-h-56 overflow-y-auto overscroll-contain">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-paper-raised">
            <tr className="border-b border-rule-strong text-left">
              <th scope="col" className="eyebrow py-2 font-semibold">
                Supplier
              </th>
              <th scope="col" className="eyebrow py-2 font-semibold">
                Dated
              </th>
              <th scope="col" className="eyebrow py-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>

          {load === "loading" ? (
            <SkeletonRows />
          ) : (
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="ledger-in border-b border-rule"
                  style={{ animationDelay: `${index * STAGGER_MS}ms` }}
                >
                  <td className="py-2 pr-3 text-ink">{row.counterparty}</td>
                  <td className="numerals py-2 pr-3 font-mono text-xs text-ink-muted">
                    {formatDateShort(row.doc_date) ?? "no date"}
                  </td>
                  <td className="numerals py-2 text-right font-mono text-ink">
                    {formatRupees(row.amount)}
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

      {load === "ready" && rows.length > 0 && (
        <p className="mt-3 flex items-baseline justify-between border-t border-rule-strong pt-3 text-sm">
          <span className="text-ink-muted">Attached in support</span>
          <span className="numerals font-mono font-semibold text-ink">
            {formatRupees(total)}
          </span>
        </p>
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
