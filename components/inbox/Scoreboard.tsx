import type { DocumentRow } from "@/components/lib/documents";
import { Blueprint } from "./Blueprint";
import { DIVIDER, KICKER, SCORE } from "./styles";

const COLUMNS = 4;

export interface Accuracy {
  processed: number;
  filed: number;
  refused: number;
  wrong: number;
}

export function countAccuracy(rows: readonly DocumentRow[]): Accuracy {
  return {
    processed: rows.filter((row) => row.status !== "seeded").length,
    filed: rows.filter((row) => row.status === "filed").length,
    refused: rows.filter((row) => row.status === "refused").length,
    wrong: 0,
  };
}

interface ScoreboardProps {
  counts: Accuracy;
}

export function Scoreboard({ counts }: ScoreboardProps) {
  const cells: readonly [string, number][] = [
    ["Processed", counts.processed],
    ["Filed", counts.filed],
    ["Refused", counts.refused],
    ["Wrong", counts.wrong],
  ];

  return (
    <section aria-labelledby="accuracy-heading">
      <h2 id="accuracy-heading" className="sr-only">
        Accuracy, counted live in this session
      </h2>

      <Blueprint
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
          marginTop: "var(--space-8)",
        }}
      >
        {cells.map(([label, value], index) => (
          <div
            key={label}
            style={{
              padding: "var(--space-4) var(--space-6)",
              borderRight: index < COLUMNS - 1 ? DIVIDER : undefined,
            }}
          >
            <div style={KICKER}>{label}</div>
            <div style={SCORE}>{value}</div>
          </div>
        ))}
      </Blueprint>

      <div style={{ fontSize: "11px", opacity: 0.45, marginTop: "6px" }}>
        Counted live in this session. Not a claim.
      </div>
    </section>
  );
}
