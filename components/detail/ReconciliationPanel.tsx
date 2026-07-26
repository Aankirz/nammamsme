import Link from "next/link";
import type { ReturnDetail } from "@/lib/types";
import type { DocumentRow } from "@/components/lib/documents";
import { formatDate } from "@/components/lib/copy";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { monthsApartPhrase, type Reconciliation } from "@/components/lib/returns";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";

interface ReconciliationPanelProps {
  detail: ReturnDetail;
  reconciliation: Reconciliation;
  notice: DocumentRow | null;
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
      className="border-r border-rule px-[var(--space-4)] py-[var(--space-4)] last:border-r-0"
      style={tinted ? { backgroundColor: "var(--color-accent-100)" } : undefined}
    >
      <Kicker style={{ letterSpacing: "0.14em", opacity: tinted ? 0.6 : 0.5 }}>
        {label}
      </Kicker>
      <p
        className={`numerals font-[family-name:var(--font-heading)] text-[22px] leading-[1.1] font-semibold ${
          tinted ? "text-[var(--color-accent-800)]" : ""
        }`}
      >
        {formatRupees(amount)}
      </p>
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
  const apart = monthsApartPhrase(
    detail.filed_on ?? detail.period_end,
    notice?.doc_date ?? notice?.created_at ?? null,
  );

  return (
    <section aria-labelledby="reconciliation-heading">
      <Kicker as="h2" id="reconciliation-heading" className="mb-[var(--space-3)]">
        Input credit, against what your suppliers filed
      </Kicker>

      <Blueprint>
        <div className="grid grid-cols-3">
          <Total label="You claimed" amount={claimed} />
          <Total label="Suppliers reported" amount={reported} />
          <Total
            label={gapIsReal ? "Unmatched" : "Matched in full"}
            amount={Math.abs(unmatched)}
            tinted
          />
        </div>

        {gapIsReal && (
          <p className="border-t border-rule px-[var(--space-4)] py-[var(--space-3)] text-[12.5px] opacity-60 [text-wrap:pretty]">
            Credit the department cannot see is credit it will ask you to give back.
          </p>
        )}

        {notice && (
          <div className="border-t border-rule px-[var(--space-4)] py-[var(--space-4)]">
            <p className="text-[13.5px] [text-wrap:pretty]">
              This gap became a demand notice{apart ? ` ${apart} later` : ""}.
            </p>

            <Link
              href={`/doc/${encodeURIComponent(notice.id)}`}
              className="btn btn-primary btn-block mt-[var(--space-3)] justify-between"
            >
              <span>Open the notice</span>
              {noticeAmount !== null && (
                <span className="numerals">{formatRupees(noticeAmount)}</span>
              )}
            </Link>

            {notice.deadline && (
              <p className="numerals mt-2 text-[11.5px] opacity-60">
                Reply by {formatDate(notice.deadline)}.
              </p>
            )}
          </div>
        )}

        {!notice && detail.led_to && (
          <p className="border-t border-rule px-[var(--space-4)] py-[var(--space-3)] text-[12.5px] opacity-60">
            This gap produced a demand notice that is not in this file.
          </p>
        )}
      </Blueprint>
    </section>
  );
}
