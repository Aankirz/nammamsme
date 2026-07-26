"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import type { TracedBlocker } from "@/components/lib/blockers";
import { formatDateShort } from "@/components/lib/copy";
import type { Fact } from "@/components/lib/facts";
import type { RateIndex } from "@/components/lib/rate";
import type { BlockKey, DocumentSource } from "@/components/lib/source";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";
import { EvidenceTable, type DraftLoad, type ReplyDraft } from "./EvidenceTable";
import { FilePanel, type ConfirmField, type FileStage } from "./FilePanel";
import { FiledScreen } from "./FiledScreen";
import { RefusalPanel } from "./RefusalPanel";
import { SourcePane } from "./SourcePane";
import { TracedFacts } from "./TracedFacts";

interface DetailBodyProps {
  documentId: string;
  header: ReactNode;
  plainWords: ReactNode;
  ladder: ReactNode;
  checks: ReactNode;
  ask: ReactNode;
  facts: readonly Fact[];
  source: DocumentSource | null;
  pageLabel: string;
  blockers: readonly TracedBlocker[];
  blockedReason: string;
  canFile: boolean;
  fileLabel: string;
  confirm: readonly ConfirmField[];
  filedRef: string | null;
  rates: RateIndex;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function stampNow(): string {
  const now = new Date();
  const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${formatDateShort(iso) ?? iso}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function toDraft(payload: unknown): ReplyDraft | null {
  if (typeof payload !== "object" || payload === null) return null;

  const draft = payload as Record<string, unknown>;
  const evidence = draft.evidence as Record<string, unknown> | undefined;
  if (!evidence || !Array.isArray(evidence.rows)) return null;

  const rows = evidence.rows.flatMap((value) => {
    if (typeof value !== "object" || value === null) return [];
    const row = value as Record<string, unknown>;
    return [
      {
        counterparty: typeof row.counterparty === "string" ? row.counterparty : "",
        invoice_ref: typeof row.invoice_ref === "string" ? row.invoice_ref : "",
        doc_date: typeof row.doc_date === "string" ? row.doc_date : "",
        taxable: typeof row.taxable === "number" ? row.taxable : 0,
        gst: typeof row.gst === "number" ? row.gst : 0,
      },
    ];
  });

  return {
    rows,
    claimedTotal: typeof evidence.claimedTotal === "number" ? evidence.claimedTotal : 0,
    matchedTotal: typeof evidence.matchedTotal === "number" ? evidence.matchedTotal : 0,
    gap: typeof evidence.gap === "number" ? evidence.gap : 0,
    statements: Array.isArray(draft.statements)
      ? draft.statements.filter((entry): entry is string => typeof entry === "string")
      : [],
  };
}

function AdvicePanel() {
  const [sent, setSent] = useState(false);

  return (
    <Blueprint as="section" className="p-[var(--space-6)]">
      <Kicker as="h2" className="mb-[var(--space-4)]">
        What you can do with this
      </Kicker>

      <p className="text-[12.5px] opacity-70 [text-wrap:pretty]">
        Nothing is filed against a document of this kind. The figures above are read
        off the page so your CA can act on them.
      </p>

      <button
        type="button"
        onClick={() => setSent(true)}
        className="btn btn-primary btn-block mt-[var(--space-6)]"
      >
        Send to my CA
      </button>

      <p aria-live="polite" className="mt-2 text-center text-[11.5px] opacity-50">
        {sent
          ? "Noted. Sending to your CA is the next thing being built."
          : "The document and both machine reads go with it."}
      </p>
    </Blueprint>
  );
}

export function DetailBody({
  documentId,
  header,
  plainWords,
  ladder,
  checks,
  ask,
  facts,
  source,
  pageLabel,
  blockers,
  blockedReason,
  canFile,
  fileLabel,
  confirm,
  filedRef,
  rates,
}: DetailBodyProps) {
  const router = useRouter();
  const [active, setActive] = useState<BlockKey | null>(null);
  const [load, setLoad] = useState<DraftLoad>("loading");
  const [draft, setDraft] = useState<ReplyDraft | null>(null);
  const [stage, setStage] = useState<FileStage>("idle");
  const [arn, setArn] = useState<string | null>(null);
  const [filedAt, setFiledAt] = useState("");
  const [, startTransition] = useTransition();

  const blocked = blockers.length > 0;
  const showsEvidence = canFile && !blocked;

  useEffect(() => {
    if (!showsEvidence) return;
    let live = true;

    async function read() {
      try {
        const response = await fetch(`/api/reply/${documentId}`, {
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error(String(response.status));

        const parsed = toDraft(await response.json());
        if (!live) return;
        if (!parsed) {
          setLoad("failed");
          return;
        }

        setDraft(parsed);
        setLoad("ready");
      } catch {
        if (live) setLoad("failed");
      }
    }

    void read();
    return () => {
      live = false;
    };
  }, [documentId, showsEvidence]);

  async function file() {
    setStage("filing");

    try {
      const response = await fetch("/api/drc06", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (!response.ok) throw new Error(String(response.status));

      const payload: unknown = await response.json();
      const reference =
        typeof payload === "object" && payload !== null
          ? (payload as { arn?: unknown }).arn
          : null;

      setArn(typeof reference === "string" ? reference : null);
      setFiledAt(stampNow());
      setStage("filed");
      startTransition(() => router.refresh());
    } catch {
      setStage("failed");
    }
  }

  function select(key: BlockKey) {
    setActive((current) => (current === key ? null : key));
  }

  if (stage === "filed") {
    return <FiledScreen arn={arn} filedAt={filedAt} draft={draft} />;
  }

  return (
    <>
      {blocked && (
        <RefusalPanel
          blockers={blockers}
          active={active}
          onSelect={select}
          fileLabel={fileLabel}
          reason={blockedReason}
        />
      )}

      <div className="grid items-start gap-[var(--space-8)] lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid min-w-0 gap-[var(--space-8)]">
          {header}

          <TracedFacts
            facts={facts}
            active={active}
            onSelect={select}
            traceable={source !== null}
          />

          {plainWords}
          {ladder}

          {showsEvidence && (
            <EvidenceTable load={load} draft={draft} rates={rates} />
          )}

          {ask}
        </div>

        <div className="grid min-w-0 gap-[var(--space-6)] lg:sticky lg:top-[76px]">
          <SourcePane
            source={source}
            pageLabel={pageLabel}
            active={active}
            onSelect={select}
          />

          {checks}

          {canFile ? (
            !blocked && (
              <FilePanel
                fields={confirm}
                fileLabel={fileLabel}
                stage={stage}
                filedRef={filedRef}
                onFile={file}
              />
            )
          ) : (
            <AdvicePanel />
          )}
        </div>
      </div>
    </>
  );
}
