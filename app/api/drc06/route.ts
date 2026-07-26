import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Stands in for the real GST portal's DRC-06 submission endpoint. D-17: filing goes
 * to a faithful mock, stated aloud on stage. Everything upstream of this route is
 * real; this route is the only pretend part, and it pretends accurately.
 */

const ARN_PREFIX = "AA";
const ARN_SEQUENCE_DIGITS = 7;
/** IST is UTC+5:30 and has no DST. The portal stamps ARNs in IST. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** `AA` + DDMMYY + 7 sequence digits — 13 digits total, e.g. AA0308260012345. */
function generateArn(filedAt: Date): string {
  const ist = new Date(filedAt.getTime() + IST_OFFSET_MS);
  const dd = String(ist.getUTCDate()).padStart(2, "0");
  const mm = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(ist.getUTCFullYear() % 100).padStart(2, "0");

  let sequence = "";
  for (let i = 0; i < ARN_SEQUENCE_DIGITS; i += 1) {
    sequence += String(Math.floor(Math.random() * 10));
  }

  return `${ARN_PREFIX}${dd}${mm}${yy}${sequence}`;
}

interface Drc06Body {
  documentId?: unknown;
  document_id?: unknown;
  id?: unknown;
  simulateFailure?: unknown;
}

function readTargetId(body: Drc06Body): string | null {
  for (const candidate of [body.documentId, body.document_id, body.id]) {
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }
  return null;
}

/**
 * POST /api/drc06
 *
 * Body: `{ documentId?, simulateFailure?, ...reply fields }`. Reply fields are
 * accepted and echoed nowhere — the portal is a mock and the reply body is already
 * rendered in-app (D-14).
 *
 * `simulateFailure: true` returns 503-style `PORTAL_UNAVAILABLE` as HTTP 500, so the
 * demo has a visible recovery path. Nothing is written when filing fails.
 *
 * On success the target row moves to `status: "filed"` and the ARN is stored in
 * `file_url`. With no id supplied the hero GST notice is the target, since it is the
 * only document type with an action path (D-03).
 */
export async function POST(request: Request) {
  let body: Drc06Body = {};

  try {
    const parsed: unknown = await request.json();
    if (parsed !== null && typeof parsed === "object") body = parsed as Drc06Body;
  } catch {
    // An empty or malformed body is not fatal — the mock needs no fields to file.
    body = {};
  }

  if (body.simulateFailure === true) {
    return Response.json({ error: "PORTAL_UNAVAILABLE" }, { status: 500 });
  }

  const requestedId = readTargetId(body);
  const rows = await db.listDocuments();
  const target = requestedId
    ? rows.find((row) => row.id === requestedId)
    : rows.find((row) => row.doc_type === "gst_notice");

  if (!target) {
    return Response.json({ error: "DOCUMENT_NOT_FOUND" }, { status: 404 });
  }

  const filedAtDate = new Date();
  const filed_at = filedAtDate.toISOString();
  const arn = generateArn(filedAtDate);

  await db.updateDocument(target.id, { status: "filed", file_url: arn });

  return Response.json({
    arn,
    filed_at,
    status: "SUBMITTED",
    document_id: target.id,
  });
}
