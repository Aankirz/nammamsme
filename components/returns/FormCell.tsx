import Link from "next/link";
import { formatDateShort } from "@/components/lib/copy";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { returnStatus } from "@/components/lib/returns";
import type { Tone } from "@/components/lib/urgency";
import { KICKER, MARK, QUIET_FIGURE } from "@/components/inbox/styles";
import { formTitle, SLOT_FORM } from "./copy";
import { unmatchedOf, type FormSlot, type HistoryEntry } from "./history";

const RULE_CLASS: Record<Tone, string> = {
  stamp: "bg-stamp",
  pending: "bg-pending",
  settled: "bg-settled",
  quiet: "bg-rule",
  unknown: "bg-rule",
};

interface FormCellProps {
  slot: FormSlot;
  entry: HistoryEntry | null;
  months: number;
  now: Date;
  gapShownBelow?: boolean;
}

interface PairProps {
  label: string;
  amount: number;
  urgent?: boolean;
}

function Pair({ label, amount, urgent = false }: PairProps) {
  return (
    <div className="flex items-baseline justify-between gap-[var(--space-3)]">
      <span className="min-w-0 text-[12px] opacity-55">{label}</span>
      <span
        className="numerals shrink-0 text-[13px] font-semibold whitespace-nowrap"
        style={urgent ? { color: "var(--stamp)" } : undefined}
      >
        {formatRupees(amount)}
      </span>
    </div>
  );
}

function Empty({ slot, months }: { slot: FormSlot; months: number }) {
  const form = SLOT_FORM[slot];

  return (
    <div className="min-w-0">
      <span aria-hidden="true" className="block h-[2px] bg-rule opacity-40" />
      <div className="pt-[var(--space-3)] opacity-35">
        <p className="m-0 font-[family-name:var(--font-heading)] text-[17px] leading-[1.15] font-semibold">
          {formTitle(form, months)}
        </p>
        <p style={MARK} className="m-0 mt-[3px]">
          {form}
        </p>
        <p className="m-0 mt-[var(--space-3)] text-[12px]">Not in your file for this period.</p>
      </div>
    </div>
  );
}

function Credit({ entry, gapShownBelow }: { entry: HistoryEntry; gapShownBelow: boolean }) {
  const { detail } = entry;
  const claimed = hasAmount(detail.itc_claimed) ? detail.itc_claimed : null;
  const reported = hasAmount(detail.itc_available) ? detail.itc_available : null;

  if (claimed === null && reported === null) return null;

  if (claimed === null && reported !== null) {
    return (
      <div className="mt-[var(--space-4)] grid gap-[5px]">
        <Pair label="Your suppliers reported" amount={reported} />
        <p className="m-0 text-[11.5px] opacity-45">
          Waiting to be claimed. You get it only when this return is filed.
        </p>
      </div>
    );
  }

  if (claimed === null || reported === null) return null;

  const gap = unmatchedOf(detail);

  return (
    <div className="mt-[var(--space-4)] grid gap-[5px]">
      <Pair label="Credit you claimed" amount={claimed} />
      <Pair label="Your suppliers reported" amount={reported} />

      {gap > 0 && !gapShownBelow && <Pair label="Never reported" amount={gap} urgent />}

      {gap === 0 && (
        <p className="m-0 text-[11.5px] opacity-45">Matched in full. Nothing left hanging.</p>
      )}
    </div>
  );
}

export function FormCell({ slot, entry, months, now, gapShownBelow = false }: FormCellProps) {
  if (entry === null) return <Empty slot={slot} months={months} />;

  const { row, detail } = entry;
  const status = returnStatus(row, now);
  const filed = detail.state === "filed";
  const late = status.standing === "overdue";
  const filedOn = formatDateShort(detail.filed_on);
  const dueOn = formatDateShort(row.deadline);
  const ruleClass = filed ? "bg-rule" : RULE_CLASS[status.countTone];

  const dueWord = late ? "Was due" : "Due";

  const statusText = filed
    ? filedOn
      ? `Filed ${filedOn}`
      : "Filed"
    : dueOn
      ? `${dueWord} ${dueOn} · ${status.phrase}`
      : status.phrase;

  return (
    <div className="min-w-0">
      <span aria-hidden="true" className={`block h-[2px] ${ruleClass}`} />

      <div className="pt-[var(--space-3)]">
        <h3 className="m-0 font-[family-name:var(--font-heading)] text-[17px] leading-[1.15] font-semibold">
          <Link
            href={`/doc/${encodeURIComponent(row.id)}`}
            className="no-underline hover:underline"
            style={{ color: "var(--color-text)", opacity: filed ? 0.75 : 1 }}
          >
            {formTitle(detail.form, months)}
          </Link>
        </h3>

        <p style={MARK} className="m-0 mt-[3px]">
          {detail.form}
        </p>

        <p
          className="numerals m-0 mt-[var(--space-3)] text-[12.5px]"
          style={
            late
              ? { color: "var(--stamp)", fontWeight: 600 }
              : filed
                ? { opacity: 0.55 }
                : { color: "var(--pending)", fontWeight: 500 }
          }
        >
          {statusText}
        </p>

        {hasAmount(detail.tax_payable) && (
          <div className="mt-[var(--space-4)]">
            <p style={KICKER} className="m-0">
              {filed ? "Tax paid" : "Tax not yet paid"}
            </p>
            <p
              style={{ ...QUIET_FIGURE, color: filed ? "var(--ink-muted)" : undefined }}
              className="m-0 mt-[2px] whitespace-nowrap"
            >
              {formatRupees(detail.tax_payable)}
            </p>
          </div>
        )}

        <Credit entry={entry} gapShownBelow={gapShownBelow} />

        {hasAmount(detail.late_fee) && detail.late_fee > 0 && (
          <div className="mt-[var(--space-3)]">
            <Pair label={filed ? "Late fee paid" : "Late fee so far"} amount={detail.late_fee} urgent />
          </div>
        )}

        {detail.arn && (
          <p className="numerals m-0 mt-[var(--space-3)] text-[11px] break-all opacity-40">
            ARN {detail.arn}
          </p>
        )}
      </div>
    </div>
  );
}
