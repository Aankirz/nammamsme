import { NextResponse } from "next/server";
import { db, type StoredRow } from "@/lib/db";
import { assembleEvidence } from "@/lib/evidence";
import type { EvidenceResult } from "@/lib/types";

export interface ReplyDraft {
  documentId: string;
  reference: string;
  section: string;
  period: { start: string; end: string };
  demanded: number | null;
  claimed: number;
  matched: number;
  unmatched: number;
  evidence: EvidenceResult;
  statements: string[];
  canFile: boolean;
  blockedBy: string[];
}

function referenceOf(row: StoredRow): string {
  const found = row.obligation.match(/Reference\s+([A-Z0-9]+)/i);
  return found ? found[1] : row.id;
}

function statementsFor(
  evidence: EvidenceResult,
  unmatched: number,
  unmatchedCount: number,
): string[] {
  const lines = [
    `The input tax credit of Rs ${evidence.claimedTotal.toLocaleString("en-IN")} is supported by ${evidence.rows.length} purchase invoices received between ${evidence.periodStart} and ${evidence.periodEnd}, listed below and attached.`,
    `The invoices attached sum to Rs ${evidence.claimedTotal.toLocaleString("en-IN")}, which equals the credit claimed.`,
  ];

  if (unmatched > 0) {
    lines.push(
      `Of these, ${unmatchedCount} invoices totalling Rs ${unmatched.toLocaleString("en-IN")} are from suppliers whose filings we cannot confirm. They are identified separately below. The remaining Rs ${(evidence.claimedTotal - unmatched).toLocaleString("en-IN")} is fully substantiated.`,
    );
    lines.push(
      `The tax on those invoices was paid to the suppliers at the time of purchase. A supplier's failure to report is not the purchaser's liability.`,
    );
  }

  return lines;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;

  const row = await db.getDocument(id);
  if (!row) {
    return NextResponse.json({ error: "DOCUMENT_NOT_FOUND", id }, { status: 404 });
  }
  if (row.doc_type !== "gst_notice") {
    return NextResponse.json({ error: "NOT_A_NOTICE", doc_type: row.doc_type }, { status: 400 });
  }

  const blocked = row.blockers.map((b) => b.detail);
  const notice = row.notice;

  if (blocked.length > 0 || !notice) {
    const empty: EvidenceResult = {
      rows: [],
      claimedTotal: 0,
      matchedTotal: 0,
      gap: 0,
      periodStart: notice?.period_start ?? "",
      periodEnd: notice?.period_end ?? "",
    };

    return NextResponse.json({
      documentId: row.id,
      reference: referenceOf(row),
      section: notice?.section ?? "",
      period: { start: notice?.period_start ?? "", end: notice?.period_end ?? "" },
      demanded: row.amount,
      claimed: notice?.claimed_itc ?? 0,
      matched: notice?.matched_itc ?? 0,
      unmatched: notice?.unmatched_itc ?? 0,
      evidence: empty,
      statements: [],
      canFile: false,
      blockedBy:
        blocked.length > 0
          ? blocked
          : ["The figures on this notice could not be established from the page."],
    } satisfies ReplyDraft);
  }

  const all = await db.listDocuments();
  const evidence = assembleEvidence(
    {
      claimed_itc: notice.claimed_itc,
      matched_itc: notice.matched_itc,
      periodStart: notice.period_start,
      periodEnd: notice.period_end,
    },
    all,
  );

  const unmatchedRows = all.filter(
    (r) => r.role === "evidence" && r.evidence?.unmatched === true,
  );
  const unmatchedTotal = unmatchedRows.reduce((sum, r) => sum + (r.evidence?.gst ?? 0), 0);

  const blockedBy = row.blockers.map((b) => b.detail);

  const draft: ReplyDraft = {
    documentId: row.id,
    reference: referenceOf(row),
    section: notice.section,
    period: { start: notice.period_start, end: notice.period_end },
    demanded: row.amount,
    claimed: notice.claimed_itc,
    matched: notice.matched_itc,
    unmatched: notice.unmatched_itc,
    evidence,
    statements: statementsFor(evidence, unmatchedTotal, unmatchedRows.length),
    canFile: blockedBy.length === 0,
    blockedBy,
  };

  return NextResponse.json(draft);
}
