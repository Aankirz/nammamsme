/**
 * Server-side reader for `GET /api/documents`.
 *
 * The route is owned by another workstream and may not exist yet. Every
 * failure path here returns an empty list rather than throwing — an inbox that
 * renders "no documents" is recoverable on stage; a 500 is not.
 */

import { headers } from "next/headers";
import type { Blocker, ObligationRow } from "@/lib/types";
import { deadlineSortKey } from "./dates";

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
function toObligationRow(value: unknown): ObligationRow | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as ObligationRow;
  if (typeof candidate.id !== "string" || candidate.id.length === 0) {
    return null;
  }

  return {
    ...candidate,
    counterparty: candidate.counterparty ?? "",
    obligation: candidate.obligation ?? "",
    consequence: candidate.consequence ?? "",
    blockers: Array.isArray(candidate.blockers)
      ? candidate.blockers.filter(isBlocker)
      : [],
  };
}

function toObligationRows(payload: unknown): ObligationRow[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: unknown[] }).data as unknown[])
      : [];

  return list
    .map(toObligationRow)
    .filter((row): row is ObligationRow => row !== null);
}

export async function fetchDocuments(): Promise<ObligationRow[]> {
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

    return toObligationRows(await response.json());
  } catch {
    return [];
  }
}

/** Most urgent first. Undated rows sink to the bottom, newest of those first. */
export function sortByDeadline(rows: readonly ObligationRow[]): ObligationRow[] {
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
  rows: readonly ObligationRow[],
  id: string,
): ObligationRow | null {
  return rows.find((row) => row.id === id) ?? null;
}
