import { headers } from "next/headers";
import type { Blocker, ObligationRow, ReturnDetail } from "@/lib/types";
import { deadlineSortKey } from "./dates";
import { toReturnDetail } from "./returns";
import { toDocumentSource, type DocumentSource } from "./source";

export interface DocumentRow extends ObligationRow {
  source: DocumentSource | null;
  return: ReturnDetail | null;
}

const DOCUMENTS_PATH = "/api/documents?role=all";

async function resolveBaseUrl(): Promise<string | null> {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return null;
  }

  const isLocal = host.startsWith("localhost") || host.startsWith("127.");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");

  return `${protocol}://${host}`;
}

function isBlocker(value: unknown): value is Blocker {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Blocker).detail === "string"
  );
}

function toDocumentRow(value: unknown): DocumentRow | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as ObligationRow & { source?: unknown; return?: unknown };
  if (typeof candidate.id !== "string" || candidate.id.length === 0) {
    return null;
  }

  return {
    ...candidate,
    source: toDocumentSource(candidate.source),
    return: toReturnDetail(candidate.return),
    counterparty: candidate.counterparty ?? "",
    obligation: candidate.obligation ?? "",
    consequence: candidate.consequence ?? "",
    blockers: Array.isArray(candidate.blockers)
      ? candidate.blockers.filter(isBlocker)
      : [],
  };
}

function belongsInTheFile(row: DocumentRow): boolean {
  return row.doc_type === "gst_return" || row.role !== "evidence";
}

function toDocumentRows(payload: unknown): DocumentRow[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: unknown[] }).data as unknown[])
      : [];

  return list
    .map(toDocumentRow)
    .filter((row): row is DocumentRow => row !== null)
    .filter(belongsInTheFile);
}

export async function fetchDocuments(): Promise<DocumentRow[]> {
  try {
    const baseUrl = await resolveBaseUrl();
    if (!baseUrl) {
      return [];
    }

    const response = await fetch(`${baseUrl}${DOCUMENTS_PATH}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return [];
    }

    return toDocumentRows(await response.json());
  } catch {
    return [];
  }
}

export function sortByDeadline(rows: readonly DocumentRow[]): DocumentRow[] {
  return [...rows].sort((a, b) => {
    const keyA = deadlineSortKey(a.deadline);
    const keyB = deadlineSortKey(b.deadline);

    if (keyA !== keyB) {
      return keyA < keyB ? -1 : 1;
    }

    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}

export function findDocument(
  rows: readonly DocumentRow[],
  id: string,
): DocumentRow | null {
  return rows.find((row) => row.id === id) ?? null;
}
