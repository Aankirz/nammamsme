import Link from "next/link";
import type { ReturnDetail } from "@/lib/types";
import type { DocumentRow } from "@/components/lib/documents";
import { formatDate } from "@/components/lib/copy";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { monthsApartPhrase, type Reconciliation } from "@/components/lib/returns";

interface ReconciliationPanelProps {
  detail: ReturnDetail;
  reconciliation: Reconciliation;
  notice: DocumentRow | null;
}

function Line({
  label,
  amount,
  className = "",
}: {
  label: string;
  amount: number;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-6 py-2 ${className}`}>
      <dt className="text-base text-ink-muted">{label}</dt>
      <dd className="numerals font-mono text-lg font-semibold tracking-[-0.02em] text-ink">
        {formatRupees(amount)}
      </dd>
    </div>
  );
}

export function ReconciliationPanel({
  detail,
  reconciliation,
  notice,
}: ReconciliationPanelProps) {
  const { claimed, reported, unmatched } = reconciliation;
  const gapIsReal = unmatched > 0;
  const noticeAmount = notice && hasAmount(notice.amount) ? notice.amount : null;
  const gapAt = detail.filed_on ?? detail.period_end;
  const noticeAt = notice?.doc_date ?? notice?.created_at ?? null;
  const apart = monthsApartPhrase(gapAt, noticeAt);

  return (
    <section
      aria-labelledby="reconciliation-heading"
      className="border border-rule bg-paper-raised"
    >
      <span
        aria-hidden="true"
        className={`block h-[2px] w-full ${gapIsReal ? "bg-stamp" : "bg-settled"}`}
      />

      <div className="px-6 pb-6 pt-5">
        <h2 id="reconciliation-heading" className="eyebrow">
          Input credit, against what your suppliers filed
        </h2>

        <dl className="mt-4">
          <Line label="You claimed" amount={claimed} />
          <Line label="Your suppliers reported" amount={reported} />

          <div className="mt-1 flex items-baseline justify-between gap-6 border-t border-rule-strong pt-3">
            <dt
              className={`text-base font-semibold ${gapIsReal ? "text-stamp" : "text-settled"}`}
            >
              {gapIsReal ? "Unmatched" : "Matched in full"}
            </dt>
            <dd
              className={`numerals font-mono text-2xl font-semibold tracking-[-0.02em] ${
                gapIsReal ? "text-stamp" : "text-settled"
              }`}
            >
              {formatRupees(Math.abs(unmatched))}
            </dd>
          </div>
        </dl>

        {gapIsReal && (
          <p className="mt-4 max-w-[46ch] text-sm text-ink-muted">
            Credit the department cannot see is credit it will ask you to give back.
          </p>
        )}

        {notice && (
          <div className="mt-6 border-t border-rule pt-5">
            <p className="max-w-[44ch] text-base text-ink">
              This gap became a demand notice{apart ? ` ${apart} later` : ""}.
            </p>

            <p className="mt-4">
              <Link
                href={`/doc/${encodeURIComponent(notice.id)}`}
                className="group flex items-center justify-between gap-4 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-ink-invert transition-[opacity,transform] duration-150 ease-[var(--ease-out)] hover:opacity-90 active:scale-[0.99]"
              >
                <span>Open the notice</span>
                <span className="flex items-baseline gap-2">
                  {noticeAmount !== null && (
                    <span className="numerals font-mono">
                      {formatRupees(noticeAmount)}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-150 ease-[var(--ease-out)] group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </span>
              </Link>
            </p>

            {notice.deadline && (
              <p className="numerals mt-3 text-sm text-ink-muted">
                Reply by{" "}
                <span className="font-mono text-ink">{formatDate(notice.deadline)}</span>.
              </p>
            )}
          </div>
        )}

        {!notice && detail.led_to && (
          <p className="mt-6 max-w-[46ch] border-t border-rule pt-5 text-sm text-ink-muted">
            This gap produced a demand notice that is not in this file.
          </p>
        )}
      </div>
    </section>
  );
}
