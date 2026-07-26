import Link from "next/link";
import type { DocumentRow } from "@/components/lib/documents";
import { formatDateShort, shortName } from "@/components/lib/copy";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { Blueprint } from "./Blueprint";
import { CameraIcon } from "./icons";
import {
  actionDetail,
  actionTitle,
  deadlineCount,
  isUrgent,
  kindLabel,
  STATUS_LABEL,
  STATUS_TAG,
} from "./rows";
import { KICKER, NUMERIC, SECTION_BAR, TAG_SMALL } from "./styles";

interface DocumentTableProps {
  rows: readonly DocumentRow[];
  now: Date;
}

function Deadline({ row, now }: { row: DocumentRow; now: Date }) {
  const urgent = isUrgent(row, now);

  return (
    <div className="flex items-center" style={{ gap: "7px", opacity: urgent ? 1 : 0.85 }}>
      <span
        aria-hidden="true"
        style={{
          width: "6px",
          height: "6px",
          display: "inline-block",
          background: urgent ? "var(--stamp)" : "transparent",
          border: urgent ? undefined : "1px solid var(--color-neutral-400)",
        }}
      />
      <span style={NUMERIC}>{formatDateShort(row.deadline) ?? "No date"}</span>
      <span
        style={{
          fontSize: "11px",
          fontWeight: urgent ? 600 : 400,
          color: urgent ? "var(--stamp)" : undefined,
          opacity: urgent ? 1 : 0.6,
        }}
      >
        {deadlineCount(row, now)}
      </span>
    </div>
  );
}

export function DocumentTable({ rows, now }: DocumentTableProps) {
  return (
    <section aria-labelledby="documents-heading">
      <div style={SECTION_BAR}>
        <h2 id="documents-heading" style={KICKER}>
          Sorted by deadline · red means 7 days or less
        </h2>
        <Link href="/doc/new" className="btn btn-primary">
          <CameraIcon />
          Add a document
        </Link>
      </div>

      <Blueprint>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: "110px" }}>Type</th>
              <th>What you must do</th>
              <th style={{ width: "200px" }}>Other party</th>
              <th style={{ width: "120px", textAlign: "right" }}>Amount</th>
              <th style={{ width: "180px" }}>Deadline</th>
              <th style={{ width: "130px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ opacity: 0.6 }}>
                  Nothing has been read yet. Add a document and its amount, date and
                  consequence appear here.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="relative">
                  <td>
                    <span className="tag tag-outline" style={TAG_SMALL}>
                      {kindLabel(row)}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/doc/${encodeURIComponent(row.id)}`}
                      className="after:absolute after:inset-0 after:content-['']"
                      style={{ fontWeight: 500, color: "inherit", textDecoration: "none" }}
                    >
                      {actionTitle(row)}
                    </Link>
                    <div style={{ fontSize: "11px", opacity: 0.5 }}>
                      {actionDetail(row, now)}
                    </div>
                  </td>
                  <td style={{ fontSize: "12.5px", opacity: 0.75 }}>
                    {shortName(row.counterparty) || "Not named"}
                  </td>
                  <td style={{ ...NUMERIC, textAlign: "right", fontWeight: 600 }}>
                    {hasAmount(row.amount) ? formatRupees(row.amount) : "—"}
                  </td>
                  <td>
                    <Deadline row={row} now={now} />
                  </td>
                  <td>
                    <span className={`tag ${STATUS_TAG[row.status]}`} style={TAG_SMALL}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Blueprint>
    </section>
  );
}
