import Link from "next/link";
import type { DocumentRow } from "@/components/lib/documents";
import { formatDateShort } from "@/components/lib/copy";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { CameraIcon } from "./icons";
import { actionTitle, deadlineCount, isBlocked, isUrgent, kindMark } from "./rows";
import { KICKER, MARK, NUMERIC, SECTION_BAR } from "./styles";

interface DocumentTableProps {
  rows: readonly DocumentRow[];
  now: Date;
}

export function DocumentTable({ rows, now }: DocumentTableProps) {
  return (
    <section aria-labelledby="documents-heading">
      <div style={SECTION_BAR}>
        <h2 id="documents-heading" style={KICKER}>
          Everything else, soonest first
        </h2>
        <Link href="/doc/new" className="btn btn-primary">
          <CameraIcon />
          Add a document
        </Link>
      </div>

      <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>What to do</th>
            <th style={{ width: "18%", textAlign: "right", paddingRight: "var(--space-6)" }}>
              How much
            </th>
            <th style={{ width: "30%" }}>By when</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ opacity: 0.6 }}>
                Nothing has been read yet. Add a document and its amount, date and
                consequence appear here.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const urgent = isUrgent(row, now);

              return (
                <tr key={row.id} className="relative">
                  <td>
                    <Link
                      href={`/doc/${encodeURIComponent(row.id)}`}
                      className="after:absolute after:inset-0 after:content-['']"
                      style={{
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      {actionTitle(row)}
                    </Link>
                    <span style={{ ...MARK, marginLeft: "10px" }}>{kindMark(row)}</span>
                    {isBlocked(row) ? (
                      <span
                        style={{ ...MARK, marginLeft: "8px", color: "var(--stamp)", opacity: 1 }}
                      >
                        Blocked
                      </span>
                    ) : null}
                  </td>

                  <td
                    style={{
                      ...NUMERIC,
                      textAlign: "right",
                      fontWeight: 600,
                      paddingRight: "var(--space-6)",
                    }}
                  >
                    {hasAmount(row.amount) ? (
                      formatRupees(row.amount)
                    ) : (
                      <span style={{ fontWeight: 400, opacity: 0.4 }}>not stated</span>
                    )}
                  </td>

                  <td>
                    <span style={NUMERIC}>{formatDateShort(row.deadline) ?? "No date"}</span>
                    <span
                      style={{
                        marginLeft: "10px",
                        fontSize: "12px",
                        fontWeight: urgent ? 600 : 400,
                        color: urgent ? "var(--stamp)" : undefined,
                        opacity: urgent ? 1 : 0.55,
                      }}
                    >
                      {deadlineCount(row, now)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}
