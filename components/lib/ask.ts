import type { DocumentRow } from "./documents";

export interface TraceStep {
  tool: string;
  args: Record<string, unknown>;
}

export interface AskAnswer {
  answer: string;
  trace: TraceStep[];
  rounds: number;
  totalMs: number;
}

const TOOL_LABEL: Record<string, string> = {
  list_obligations: "Read everything you owe and are owed",
  get_document: "Opened one document in this file",
  check_invoice_rate: "Checked a rate against the CBIC schedule",
  build_reply_evidence: "Assembled the invoices behind the credit claimed",
  filing_status: "Read what has been filed and what has not",
};

export function toolLabel(tool: string): string {
  return TOOL_LABEL[tool] ?? "Read from your records";
}

function toArgText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "none";
  return JSON.stringify(value);
}

export function formatArgs(args: Record<string, unknown>): string {
  const parts = Object.entries(args).map(([key, value]) => `${key} ${toArgText(value)}`);
  return parts.join("  ");
}

export function toAskAnswer(payload: unknown): AskAnswer | null {
  if (typeof payload !== "object" || payload === null) return null;

  const body = payload as Record<string, unknown>;
  if (typeof body.answer !== "string") return null;

  return {
    answer: body.answer,
    trace: readTrace(body.trace),
    rounds: typeof body.rounds === "number" ? body.rounds : 0,
    totalMs: typeof body.totalMs === "number" ? body.totalMs : 0,
  };
}

export function readTrace(value: unknown): TraceStep[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const step = entry as Record<string, unknown>;
    if (typeof step.tool !== "string") return [];
    return [
      {
        tool: step.tool,
        args:
          typeof step.args === "object" && step.args !== null
            ? (step.args as Record<string, unknown>)
            : {},
      },
    ];
  });
}

const ASK_FAILURE: Record<string, string> = {
  NOT_CONFIGURED: "Asking is not switched on here. Nothing was read.",
  NO_QUESTION: "Type a question first.",
  QUESTION_TOO_LONG: "That question is too long. Shorten it and ask again.",
  EXPECTED_JSON: "The question did not reach the server. Try again.",
  ASK_FAILED: "The answer did not complete. Nothing here is being asserted.",
};

export function askFailure(code: unknown): string {
  return typeof code === "string" && code in ASK_FAILURE
    ? ASK_FAILURE[code]
    : "The answer did not complete. Nothing here is being asserted.";
}

export function elapsedPhrase(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function callCountPhrase(count: number): string {
  return count === 1 ? "1 call" : `${count} calls`;
}

const NOTICE_STARTERS = [
  "What happens if I do not reply to this notice?",
  "Was any of these invoices billed at the wrong rate?",
];

const RETURN_STARTERS = [
  "Why did this return lead to a notice?",
  "What is still unfiled right now?",
];

const GENERAL_STARTERS = [
  "What is due next month?",
  "What is the largest thing I owe right now?",
];

export function askStarters(row: DocumentRow): readonly string[] {
  if (row.doc_type === "gst_notice") return NOTICE_STARTERS;
  if (row.doc_type === "gst_return") return RETURN_STARTERS;
  return GENERAL_STARTERS;
}
