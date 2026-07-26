import { NextResponse } from "next/server";
import { digitise, extractFields, findSource, type DigitiseProgress } from "@/lib/sarvam";
import { verifyExtraction } from "@/lib/verify";
import { classifyDocType } from "@/lib/classify";
import { normaliseDate } from "@/lib/normalise";
import { db, type StoredRow } from "@/lib/db";
import type { Direction, DocType } from "@/lib/types";

export const maxDuration = 120;

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPTED = [".pdf", ".png", ".jpg", ".jpeg"];

interface ProcessHop {
  step: string;
  elapsedMs: number;
}

function directionFor(docType: DocType): Direction {
  return docType === "supplier_invoice" ? "owed" : "owing";
}

function obligationFor(docType: DocType, counterparty: string | null): string {
  const who = counterparty ?? "an unnamed party";
  if (docType === "gst_notice") return `GST demand from ${who}. Reply required.`;
  if (docType === "gst_return") return `GST return acknowledgement from ${who}.`;
  if (docType === "licence") return `Licence from ${who}. Renew before it expires.`;
  return `Invoice from ${who}.`;
}

export async function POST(request: Request): Promise<NextResponse> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "EXPECTED_MULTIPART" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  if (!ACCEPTED.some((ext) => name.endsWith(ext))) {
    return NextResponse.json({ error: "UNSUPPORTED_TYPE", accepted: ACCEPTED }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE", maxBytes: MAX_BYTES }, { status: 413 });
  }

  const hops: ProcessHop[] = [];
  const started = Date.now();
  const record = (p: DigitiseProgress) => hops.push({ step: p.step, elapsedMs: p.elapsedMs });

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());

    const ocr = await digitise(bytes, file.name, { onProgress: record });

    const extraction = await extractFields(ocr.text);
    hops.push({ step: "fields extracted", elapsedMs: Date.now() - started });

    const verdict = verifyExtraction({ fields: extraction.fields }, ocr);
    hops.push({
      step: verdict.canFile ? "verified" : `blocked: ${verdict.blockers.length}`,
      elapsedMs: Date.now() - started,
    });

    const docType = classifyDocType(ocr.text);
    const { fields } = verdict;
    const counterparty = fields.counterparty ?? null;

    const hasFilingPath = docType === "gst_notice";
    const blocks = hasFilingPath && verdict.blockers.length > 0;

    const row: StoredRow = {
      id: `doc_live_${started}`,
      role: "obligation",
      doc_type: docType,
      obligation: obligationFor(docType, counterparty),
      amount: fields.amount,
      doc_date: normaliseDate(fields.doc_date),
      deadline: normaliseDate(fields.deadline),
      counterparty: counterparty ?? "Unknown",
      consequence: "",
      direction: directionFor(docType),
      status: blocks ? "refused" : "extracted",
      blockers: hasFilingPath ? verdict.blockers : [],
      source_ref: fields.amount === null ? null : findSource(ocr, String(fields.amount)),
      file_url: null,
      created_at: new Date(started).toISOString(),
      source: {
        pageWidth: ocr.pageSizes[0]?.width ?? 0,
        pageHeight: ocr.pageSizes[0]?.height ?? 0,
        blocks: ocr.blocks.map((b) => ({
          page: b.page,
          block: b.block,
          text: b.text,
          bbox: b.bbox,
        })),
      },
    };

    const saved = await db.insertDocument(row);

    return NextResponse.json({
      document: saved,
      hops,
      flags: verdict.flags,
      canFile: hasFilingPath ? verdict.canFile : false,
      totalMs: Date.now() - started,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "processing failed";
    return NextResponse.json({ error: "PROCESSING_FAILED", detail: message, hops }, { status: 502 });
  }
}

export async function GET(): Promise<NextResponse> {
  const configured = Boolean(process.env.SARVAM_API_KEY);
  return NextResponse.json({ ready: configured, accepted: ACCEPTED, maxBytes: MAX_BYTES });
}
