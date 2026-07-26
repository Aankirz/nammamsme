"use client";

import { useState } from "react";
import type { TracedBlocker } from "@/components/lib/blockers";
import type { ConsequenceStep } from "@/components/lib/consequence";
import type { Fact } from "@/components/lib/facts";
import type { BlockKey, DocumentSource } from "@/components/lib/source";
import { FactsColumn } from "./FactsColumn";
import { RefusalPanel } from "./RefusalPanel";
import { SourcePane } from "./SourcePane";

interface TraceLayoutProps {
  facts: readonly Fact[];
  obligation: readonly string[];
  consequence: readonly ConsequenceStep[];
  blockers: readonly TracedBlocker[];
  source: DocumentSource | null;
  obligationHeading: string;
}

/**
 * The only stateful piece of the detail pane: which block of the page is
 * currently being pointed at. Facts on the left and the reproduction on the
 * right both read it, so the pair has to sit under one client boundary.
 *
 * With no page to trace to, the second column is dropped rather than filled
 * with an apology, and the facts run at a comfortable measure instead.
 */
export function TraceLayout({
  facts,
  obligation,
  consequence,
  blockers,
  source,
  obligationHeading,
}: TraceLayoutProps) {
  const [active, setActive] = useState<BlockKey | null>(null);

  function select(key: BlockKey) {
    setActive((current) => (current === key ? null : key));
  }

  const twoUp = source !== null;

  return (
    <div
      className={
        twoUp
          ? "grid gap-x-10 gap-y-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          : "max-w-[68ch]"
      }
    >
      <div className="min-w-0">
        {blockers.length > 0 && (
          <RefusalPanel blockers={blockers} active={active} onSelect={select} />
        )}

        <FactsColumn
          facts={facts}
          obligation={obligation}
          consequence={consequence}
          obligationHeading={obligationHeading}
          active={active}
          onSelect={select}
          traceable={twoUp}
        />
      </div>

      {twoUp && (
        <div className="min-w-0 xl:sticky xl:top-[calc(var(--identity-height)+2rem)] xl:self-start">
          <SourcePane source={source} active={active} onSelect={select} />
        </div>
      )}
    </div>
  );
}
