/**
 * Server-side reader for `GET /api/documents`.
 *
 * The route is owned by another workstream. Every failure path here returns an
 * empty list rather than throwing: a rail that renders "no documents" is
 * recoverable on stage, a 500 is not.
 */

import { headers } from "next/headers";
import type { Blocker, ObligationRow } from "@/lib/types";
import { deadlineSortKey } from "./dates";
import { toDocumentSource, type DocumentSource } from "./source";

/**
 * A row plus the page it was read off.
 *
 * `source` is carried by the seed alongside the ten shared columns rather than
 * inside them, so it is narrowed here instead of in the shared contract.
 */
export interface DocumentRow extends ObligationRow {
  source: DocumentSource | null;
}

const DOCUMENTS_PATH = "/api/documents";

async function resolveBaseUrl(): Promise<string | null> {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

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

/** Trusts the contract but survives a partially-built API. */
function toDocumentRow(value: unknown): DocumentRow | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as ObligationRow & { source?: unknown };
  if (typeof candidate.id !== "string" || candidate.id.length === 0) {
    return null;
  }

  return {
    ...candidate,
    source: toDocumentSource(candidate.source),
    counterparty: candidate.counterparty ?? "",
    obligation: candidate.obligation ?? "",
    consequence: candidate.consequence ?? "",
    blockers: Array.isArray(candidate.blockers)
      ? candidate.blockers.filter(isBlocker)
      : [],
  };
}

function toDocumentRows(payload: unknown): DocumentRow[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: unknown[] }).data as unknown[])
      : [];

  return list
    .map(toDocumentRow)
    .filter((row): row is DocumentRow => row !== null);
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

/** Most urgent first. Undated rows sink to the bottom, newest of those first. */
export function sortByDeadline(rows: readonly DocumentRow[]): DocumentRow[] {
  return [...rows].sort((a, b) => {
    const keyA = deadlineSortKey(a.deadline);
    const keyB = deadlineSortKey(b.deadline);

    // Compared rather than subtracted: two undated rows would give NaN.
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
