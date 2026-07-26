import { SarvamAIClient } from "sarvamai";
import { unzipSync, strFromU8 } from "fflate";
import type { DigitiseResult, DigitiseBlock, SourceRef, ExtractResult } from "./types";

const POLL_MS = 2000;
const MAX_POLLS = 60;
const MAX_TOKENS = 4096;
const TERMINAL = ["Completed", "PartiallyCompleted", "Failed"];

interface SarvamPage {
  page_num: number;
  image_width: number;
  image_height: number;
  blocks: Array<{
    block_id: string;
    coordinates: { x1: number; y1: number; x2: number; y2: number };
    layout_tag: string;
    confidence: number;
    reading_order: number;
    text: string;
  }>;
}

export interface DigitiseProgress {
  step: string;
  elapsedMs: number;
}

export interface RichBlock extends DigitiseBlock {
  bbox: [number, number, number, number];
  rawConfidence: number;
  layoutTag: string;
}

export interface RichDigitiseResult extends DigitiseResult {
  blocks: RichBlock[];
  pageSizes: Array<{ page: number; width: number; height: number }>;
}

function client() {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("SARVAM_API_KEY is not set");
  return new SarvamAIClient({ apiSubscriptionKey: key });
}

export async function digitise(
  file: Uint8Array,
  filename: string,
  opts: { language?: "en-IN" | "hi-IN" | "pa-IN"; onProgress?: (p: DigitiseProgress) => void } = {},
): Promise<RichDigitiseResult> {
  const { language = "en-IN", onProgress } = opts;
  const t0 = Date.now();
  const step = (s: string) => onProgress?.({ step: s, elapsedMs: Date.now() - t0 });

  const api = client();

  const job = await api.documentIntelligence.initialise({
    job_parameters: { language, output_format: "md" },
  });
  const jobId = (job as { job_id: string }).job_id;
  step("job created");

  const links = (await api.documentIntelligence.getUploadLinks({
    job_id: jobId,
    files: [filename],
  })) as { upload_urls: Record<string, { file_url: string }> };

  const uploadUrl = links.upload_urls[filename]?.file_url;
  if (!uploadUrl) throw new Error(`no upload url returned for ${filename}`);

  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file as BodyInit,
    headers: { "x-ms-blob-type": "BlockBlob" },
  });
  if (!put.ok) throw new Error(`upload failed: ${put.status}`);
  step("uploaded");

  await api.documentIntelligence.start(jobId);

  let state = "";
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const st = (await api.documentIntelligence.getStatus(jobId)) as { job_state: string };
    state = st.job_state;
    if (TERMINAL.includes(state)) break;
  }
  if (state === "Failed") throw new Error("digitisation failed");
  step(`ocr ${state.toLowerCase()}`);

  const dl = (await api.documentIntelligence.getDownloadLinks(jobId)) as {
    download_urls: Record<string, { file_url: string }>;
  };
  const zipUrl = Object.values(dl.download_urls)[0]?.file_url;
  if (!zipUrl) throw new Error("no download url returned");

  const zipBytes = new Uint8Array(await (await fetch(zipUrl)).arrayBuffer());
  step("output retrieved");

  return unpack(zipBytes);
}

export function unpack(zipBytes: Uint8Array): RichDigitiseResult {
  const files = unzipSync(zipBytes);

  const pages: SarvamPage[] = Object.entries(files)
    .filter(([name]) => /metadata\/page_\d+\.json$/.test(name))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bytes]) => JSON.parse(strFromU8(bytes)) as SarvamPage);

  const blocks: RichBlock[] = [];
  const pageSizes: RichDigitiseResult["pageSizes"] = [];

  for (const page of pages) {
    pageSizes.push({ page: page.page_num, width: page.image_width, height: page.image_height });

    const ordered = [...page.blocks].sort((a, b) => a.reading_order - b.reading_order);
    ordered.forEach((b, idx) => {
      const { x1, y1, x2, y2 } = b.coordinates;
      blocks.push({
        page: page.page_num,
        block: idx,
        text: b.text,
        bbox: [x1, y1, x2, y2],
        rawConfidence: b.confidence,
        layoutTag: b.layout_tag,
      });
    });
  }

  const text = blocks.map((b) => b.text).join("\n");

  return { blocks, text, pageSizes };
}

const EXTRACT_SYSTEM = `You extract fields from Indian GST documents.
Return ONLY minified JSON. No prose, no markdown fence.
Every value MUST be copied verbatim from the document, exactly as printed.
If a field is not printed in the document, return null.
NEVER infer, compute, estimate, or convert. Do not do arithmetic.
Schema keys, all required:
{"amount":str|null,"tax":str|null,"interest":str|null,"penalty":str|null,
"claimed_itc":str|null,"matched_itc":str|null,"deadline":str|null,
"doc_date":str|null,"section":str|null,"counterparty":str|null,
"references_annexure":str|null}
"amount" is the grand total demanded, or the invoice total.
"deadline" is the date the reader must act by, whatever the document calls it:
a reply-by date on a notice, a payment due date on an invoice, an expiry or
"valid until" date on a licence or registration. Copy the printed date.
"counterparty" is who ISSUED or SENT this document: the tax authority, the
supplier, the licensing body. It is NEVER the addressee or recipient. If the
document is addressed "To: X" and issued by Y, counterparty is Y.
"references_annexure" is the annexure or schedule identifier the document refers
to, or null.`;

export async function extractFields(
  ocrText: string,
  opts: { model?: "sarvam-30b" | "sarvam-105b" } = {},
): Promise<ExtractResult & { references_annexure: string | null }> {
  const api = client();
  const res = await api.chat.completions({
    model: opts.model ?? "sarvam-105b",
    messages: [
      { role: "system", content: EXTRACT_SYSTEM },
      { role: "user", content: ocrText },
    ],
    temperature: 0,
    max_tokens: MAX_TOKENS,
  });

  const choice = (res as {
    choices: Array<{ finish_reason: string; message: { content: string | null } }>;
  }).choices[0];

  const raw = choice?.message?.content;
  if (!raw) return { fields: {}, references_annexure: null };

  const cleaned = raw.trim().replace(/^```(?:json)?/, "").replace(/```$/, "").trim();

  let parsed: Record<string, string | null>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { fields: {}, references_annexure: null };
  }

  const { references_annexure, ...fields } = parsed;
  return { fields, references_annexure: references_annexure ?? null };
}

export function findSource(result: RichDigitiseResult, needle: string): SourceRef | null {
  const hit = result.blocks.find((b) => b.text.includes(needle));
  if (!hit) return null;
  return { page: hit.page, block: hit.block, bbox: hit.bbox };
}
