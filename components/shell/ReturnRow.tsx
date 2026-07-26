import Link from "next/link";
import type { DocumentRow } from "@/components/lib/documents";
import { formatDateShort } from "@/components/lib/copy";
import { hasAmount } from "@/components/lib/money";
import { returnStatus, type ReturnStanding } from "@/components/lib/returns";
import { TONE_RULE_CLASSES } from "@/components/lib/urgency";
import { DayCount } from "@/components/ui/DayCount";
import { Money } from "@/components/ui/Money";

interface ReturnRowProps {
  row: DocumentRow;
  now: Date;
  current: boolean;
}

const GROUND: Record<ReturnStanding, string> = {
  overdue:
    "bg-stamp-tint py-4 hover:shadow-[inset_0_0_0_1px_var(--stamp-rule)] active:shadow-[inset_0_0_0_2px_var(--stamp-rule)]",
  due: "py-3 hover:bg-paper-raised active:bg-rule",
  unread: "py-3 hover:bg-paper-raised active:bg-rule",
  filed: "py-2.5 hover:bg-paper-raised active:bg-rule",
};

const CURRENT = "shadow-[inset_0_0_0_1px_var(--ink)]";

export function ReturnRow({ row, now, current }: ReturnRowProps) {
  const detail = row.return;
  const status = returnStatus(row, now);
  const form = detail?.form ?? "GST return";
  const period = detail?.period_label || formatDateShort(row.deadline) || "Period not read";
  const filed = status.standing === "filed";
  const overdue = status.standing === "overdue";
  const fee = detail?.late_fee ?? null;

  return (
    <li>
      <Link
        href={`/doc/${encodeURIComponent(row.id)}`}
        aria-current={current ? "page" : undefined}
        className={`relative block px-6 transition-[color,background-color,box-shadow] duration-150 ease-[var(--ease-out)] ${GROUND[status.standing]} ${
          current ? CURRENT : ""
        } ${current && !overdue ? "bg-paper-raised" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-[2px] ${TONE_RULE_CLASSES[status.ruleTone]}`}
        />

        <span className="flex items-center gap-2">
          <span
            className={`numerals inline-flex items-center rounded-sm border px-1.5 py-px font-mono text-xs font-semibold tracking-[0.04em] ${
              overdue
                ? "border-stamp-rule text-stamp"
                : "border-rule-strong text-ink-muted"
            }`}
          >
            {form}
          </span>

          <span
            className={`min-w-0 flex-1 truncate text-sm ${
              filed ? "text-ink-muted" : "font-semibold text-ink"
            }`}
          >
            {period}
          </span>

          {overdue && (
            <span className="numerals rounded-sm bg-stamp-tint px-1.5 py-px font-mono text-xs font-semibold uppercase tracking-[0.06em] text-stamp">
              Overdue
            </span>
          )}

          {filed && <DayCount text={status.count} tone={status.countTone} />}
        </span>

        {!filed && (
          <span className="mt-2 flex items-baseline gap-3">
            {overdue && hasAmount(fee) ? (
              <Money amount={fee} size="md" className="text-stamp" />
            ) : (
              <span className="numerals font-mono text-lg font-semibold text-ink">
                {formatDateShort(row.deadline) ?? "No date"}
              </span>
            )}
            <DayCount text={status.count} tone={status.countTone} className="ml-auto" />
          </span>
        )}

        {overdue && hasAmount(fee) && (
          <span className="mt-1 block text-xs text-stamp">late fee, still growing</span>
        )}

        {filed && detail?.led_to && (
          <span className="mt-1 block text-xs text-stamp">led to a demand notice</span>
        )}
      </Link>
    </li>
  );
}
