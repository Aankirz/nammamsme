import type { DocumentRow } from "@/components/lib/documents";
import { formatDateShort } from "@/components/lib/copy";
import { computeExposure, overdueReceivables } from "@/components/lib/exposure";
import { formatRupees } from "@/components/lib/money";
import { daysUntil } from "@/components/lib/dates";
import { actionTitle, deadlineCount, isUrgent } from "./rows";
import { KICKER, NOTE, QUIET_FIGURE } from "./styles";

interface StandingProps {
  rows: readonly DocumentRow[];
  now: Date;
}

interface FigureProps {
  kicker: string;
  figure: string;
  note: string;
  urgent?: boolean;
}

function Figure({ kicker, figure, note, urgent }: FigureProps) {
  return (
    <div>
      <div style={{ ...KICKER, marginBottom: "6px" }}>{kicker}</div>
      <div style={{ ...QUIET_FIGURE, color: "var(--color-neutral-800)" }}>{figure}</div>
      <div style={{ ...NOTE, marginTop: "4px", color: urgent ? "var(--stamp)" : undefined }}>
        {note}
      </div>
    </div>
  );
}

/** The next thing he owes that is still ahead of him. Returns are the plate's job. */
function soonest(rows: readonly DocumentRow[], now: Date): DocumentRow | null {
  const ahead = rows
    .filter((row) => row.direction === "owing" && row.doc_type !== "gst_return")
    .filter((row) => (daysUntil(row.deadline, now) ?? -1) >= 0)
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));

  return ahead[0] ?? null;
}

export function Standing({ rows, now }: StandingProps) {
  const exposure = computeExposure(rows, now);
  const receivables = overdueReceivables(rows, now);
  const next = soonest(rows, now);

  const thingWord = exposure.documentCount === 1 ? "thing" : "things";
  const buyerWord = receivables.count === 1 ? "buyer" : "buyers";

  return (
    <section
      aria-label="Where the money stands"
      className="grid"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
        gap: "var(--space-6)",
        marginBottom: "calc(var(--space-8) * 1.6)",
      }}
    >
      <Figure
        kicker="Going out in the next 30 days"
        figure={formatRupees(exposure.movingWithin30)}
        note={`Across ${exposure.documentCount} ${thingWord} you owe`}
      />

      <Figure
        kicker="Owed to you, unpaid over 45 days"
        figure={formatRupees(receivables.amount)}
        note={`${receivables.count} ${buyerWord}. The law lets you charge interest on this.`}
      />

      {next ? (
        <Figure
          kicker="Next date after today"
          figure={formatDateShort(next.deadline) ?? "No date"}
          note={`${actionTitle(next)} · ${deadlineCount(next, now)}`}
          urgent={isUrgent(next, now)}
        />
      ) : null}
    </section>
  );
}
