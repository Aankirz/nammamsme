import Link from "next/link";
import type { CSSProperties } from "react";
import type { DocumentRow } from "@/components/lib/documents";
import { formatDateShort } from "@/components/lib/copy";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { returnStatus, type ReturnStanding } from "@/components/lib/returns";
import { Blueprint } from "./Blueprint";
import { CELL, DIVIDER, HEADING, KICKER, NUMERIC, SECTION_BAR, TAG_SMALL, ASIDE } from "./styles";

const COLUMNS = 3;

const STANDING_LABEL: Record<ReturnStanding, string> = {
  filed: "Filed",
  overdue: "Overdue",
  due: "Open",
  unread: "Not read",
};

const STANDING_TAG: Record<ReturnStanding, string> = {
  filed: "tag-neutral",
  overdue: "tag-accent",
  due: "tag-outline",
  unread: "tag-neutral",
};

const FORM_SCOPE: Record<string, string> = {
  "GSTR-1": "outward supplies",
  "GSTR-3B": "summary and tax",
  "GSTR-9": "annual return",
};

const CTA: Record<ReturnStanding, string> = {
  filed: "Open",
  overdue: "File now",
  due: "Review and file",
  unread: "Open",
};

function noteFor(row: DocumentRow, standing: ReturnStanding): string {
  const detail = row.return;
  const fee = detail?.late_fee ?? null;

  if (standing === "overdue") {
    return hasAmount(fee) && fee > 0
      ? `Not filed. ${formatRupees(fee)} late fee so far, growing daily.`
      : "Not filed. The late fee starts the day it is missed.";
  }

  if (standing === "due") {
    return hasAmount(detail?.tax_payable)
      ? `${formatRupees(detail.tax_payable)} of tax to pay with it.`
      : "Nothing filed for this period yet.";
  }

  return "Nothing outstanding on this period.";
}

interface ReturnCellProps {
  row: DocumentRow;
  now: Date;
  index: number;
}

function ReturnCell({ row, now, index }: ReturnCellProps) {
  const detail = row.return;
  const status = returnStatus(row, now);
  const overdue = status.standing === "overdue";
  const filed = status.standing === "filed";

  const cell: CSSProperties = {
    ...CELL,
    background: "var(--color-bg)",
    borderRight: index % COLUMNS < COLUMNS - 1 ? DIVIDER : undefined,
    borderTop: index >= COLUMNS ? DIVIDER : undefined,
  };

  return (
    <div style={cell}>
      <div className="flex items-baseline justify-between" style={{ gap: "8px" }}>
        <span style={{ ...HEADING, fontSize: "22px" }}>{detail?.form ?? "GST return"}</span>
        <span className={`tag ${STANDING_TAG[status.standing]}`} style={TAG_SMALL}>
          {STANDING_LABEL[status.standing]}
        </span>
      </div>

      <div style={{ fontSize: "12px", opacity: 0.55, marginTop: "2px" }}>
        {detail?.period_label || "Period not read"}
        {detail && FORM_SCOPE[detail.form] ? ` · ${FORM_SCOPE[detail.form]}` : ""}
      </div>

      <div
        className="flex flex-wrap items-baseline"
        style={{ gap: "8px", marginTop: "var(--space-4)" }}
      >
        <span style={{ ...KICKER, letterSpacing: "0.14em" }}>Due</span>
        <span style={{ ...NUMERIC, fontSize: "14px" }}>
          {formatDateShort(row.deadline) ?? "No date"}
        </span>
        <span
          style={{
            fontSize: "11.5px",
            fontWeight: 600,
            color: overdue ? "var(--stamp)" : "inherit",
            opacity: overdue ? 1 : 0.5,
          }}
        >
          {status.count}
        </span>
      </div>

      <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "6px" }}>
        {noteFor(row, status.standing)}
      </div>

      {filed ? (
        <div style={{ marginTop: "var(--space-4)", fontSize: "12px", opacity: 0.6 }}>
          Filed {formatDateShort(detail?.filed_on) ?? "on the portal"}
          {detail?.arn ? ` · ARN ${detail.arn}` : ""}
        </div>
      ) : (
        <Link
          href={`/doc/${encodeURIComponent(row.id)}`}
          className="btn btn-primary"
          style={{ marginTop: "var(--space-4)", fontSize: "12.5px" }}
        >
          {CTA[status.standing]}
        </Link>
      )}
    </div>
  );
}

interface ReturnsPlateProps {
  returns: readonly DocumentRow[];
  now: Date;
}

export function ReturnsPlate({ returns, now }: ReturnsPlateProps) {
  const open = returns.filter((row) => returnStatus(row, now).standing !== "filed");
  const filed = returns.length - open.length;
  const shown = (open.length > 0 ? open : returns).slice(0, COLUMNS);
  const waiting = open.length - shown.length;

  if (shown.length === 0) return null;

  const filedPhrase =
    filed === 1 ? "1 earlier return filed and clear" : `${filed} earlier returns filed and clear`;
  const tail = waiting > 0 ? `${waiting} more still open · ${filedPhrase}` : filedPhrase;

  return (
    <section aria-labelledby="returns-heading">
      <div style={SECTION_BAR}>
        <h2 id="returns-heading" style={KICKER}>
          GST returns · your own filings, not notices
        </h2>
        <span style={ASIDE}>
          Nothing here comes from a photo — these are due every month whether or not
          paper arrives
        </span>
      </div>

      <Blueprint style={{ marginBottom: "var(--space-8)" }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}>
          {shown.map((row, index) => (
            <ReturnCell key={row.id} row={row} now={now} index={index} />
          ))}
        </div>

        <div
          className="flex flex-wrap items-center"
          style={{
            borderTop: DIVIDER,
            padding: "var(--space-4) var(--space-6)",
            gap: "var(--space-4)",
          }}
        >
          <span style={{ fontSize: "12.5px", opacity: 0.7 }}>
            Late filing costs ₹50 a day, and blocks the next month&apos;s return until it
            clears.
          </span>
          <div style={{ flex: 1 }} />
          <span style={ASIDE}>{tail}.</span>
        </div>
      </Blueprint>
    </section>
  );
}
