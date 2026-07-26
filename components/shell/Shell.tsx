import type { ReactNode } from "react";
import type { DocumentRow } from "@/components/lib/documents";
import { IdentityBar } from "./IdentityBar";
import { Rail } from "./Rail";

interface ShellProps {
  rows: readonly DocumentRow[];
  now: Date;
  /** The row the detail pane is showing, so the rail can mark it current. */
  selectedId?: string;
  children: ReactNode;
}

/**
 * Two-pane master-detail: identity across the top, obligations down the left,
 * the open document on the right. The rail renders identically on every route,
 * so selection is a change of pane rather than a change of screen.
 */
export function Shell({ rows, now, selectedId, children }: ShellProps) {
  return (
    <div className="min-h-dvh">
      <IdentityBar />

      <div className="lg:grid lg:grid-cols-[var(--rail-width)_minmax(0,1fr)] lg:items-start">
        <Rail rows={rows} now={now} selectedId={selectedId} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
