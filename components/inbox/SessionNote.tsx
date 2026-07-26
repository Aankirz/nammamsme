import type { DocumentRow } from "@/components/lib/documents";
import { ASIDE } from "./styles";

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

interface SessionNoteProps {
  counts: Accuracy;
}

export function SessionNote({ counts }: SessionNoteProps) {
  return (
    <p style={{ ...ASIDE, marginTop: "var(--space-8)" }}>
      This session: {counts.processed} read, {counts.filed} filed, {counts.refused} refused
      for want of evidence, {counts.wrong} wrong. Counted live, not a claim.
    </p>
  );
}
