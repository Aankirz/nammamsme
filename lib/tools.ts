import { db, type StoredRow } from "./db";
import { assembleEvidence } from "./evidence";
import { checkRate, lookupRate } from "./rates";

export interface ToolSpec {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export const TOOL_SPECS: ToolSpec[] = [
  {
    type: "function",
    function: {
      name: "list_obligations",
      description:
        "List everything this business currently owes or is owed, with amounts and deadlines. Use for questions about what is due, what is overdue, or how much is moving.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_document",
      description:
        "Fetch one document by id, including its blockers and why filing may be refused.",
      parameters: {
        type: "object",
        properties: { id: { type: "string", description: "Document id" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_invoice_rate",
      description:
        "Check a GST rate charged on an invoice against the CBIC schedule. Returns match, mismatch, ambiguous or unknown. Never invents a rate.",
      parameters: {
        type: "object",
        properties: {
          hsn: { type: "string", description: "HSN code, 4 to 8 digits" },
          charged_percent: { type: "number", description: "Rate charged on the invoice" },
        },
        required: ["hsn"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "build_reply_evidence",
      description:
        "For a GST notice, assemble the purchase invoices that support the input tax credit claimed, and report what is matched and what is unmatched.",
      parameters: {
        type: "object",
        properties: { notice_id: { type: "string", description: "Id of the GST notice" } },
        required: ["notice_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filing_status",
      description:
        "The GST return filing calendar: which returns are filed, due or overdue, with late fees and what each unfiled return blocks.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

function summarise(row: StoredRow) {
  return {
    id: row.id,
    kind: row.doc_type,
    who: row.counterparty,
    amount: row.amount,
    deadline: row.deadline,
    direction: row.direction,
    status: row.status,
    blocked: row.blockers.length > 0,
  };
}

export async function runTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === "list_obligations") {
    const rows = await db.listDocuments();
    return rows.filter((r) => r.role === "obligation").map(summarise);
  }

  if (name === "get_document") {
    const row = await db.getDocument(String(args.id ?? ""));
    if (!row) return { error: "not_found", id: args.id };
    return {
      ...summarise(row),
      obligation: row.obligation,
      consequence: row.consequence,
      blockers: row.blockers.map((b) => ({ kind: b.kind, detail: b.detail })),
    };
  }

  if (name === "check_invoice_rate") {
    const charged = typeof args.charged_percent === "number" ? args.charged_percent : null;
    const result = checkRate(String(args.hsn ?? ""), charged);
    if (charged === null) {
      const entry = lookupRate(String(args.hsn ?? ""));
      return entry
        ? { verdict: "lookup_only", code: entry.code, lawful_rates: entry.rates.map((r) => r.rate), description: entry.rates[0]?.desc }
        : result;
    }
    return result;
  }

  if (name === "build_reply_evidence") {
    const notice = await db.getDocument(String(args.notice_id ?? ""));
    if (!notice) return { error: "not_found", id: args.notice_id };
    if (notice.blockers.length > 0) {
      return {
        refused: true,
        reasons: notice.blockers.map((b) => b.detail),
      };
    }
    if (!notice.notice) return { error: "no_notice_figures", id: notice.id };

    const all = await db.listDocuments();
    const evidence = assembleEvidence(
      {
        claimed_itc: notice.notice.claimed_itc,
        matched_itc: notice.notice.matched_itc,
        periodStart: notice.notice.period_start,
        periodEnd: notice.notice.period_end,
      },
      all,
    );
    return {
      invoices: evidence.rows.length,
      claimed: evidence.claimedTotal,
      matched: evidence.matchedTotal,
      unmatched: evidence.gap,
      period: [evidence.periodStart, evidence.periodEnd],
    };
  }

  if (name === "filing_status") {
    const rows = await db.listDocuments();
    return rows
      .filter((r) => r.doc_type === "gst_return" && r.return)
      .map((r) => ({
        id: r.id,
        form: r.return!.form,
        period: r.return!.period_label,
        state: r.return!.state,
        days_late: r.return!.days_late,
        late_fee: r.return!.late_fee,
        tax_payable: r.return!.tax_payable,
        blocks: r.return!.blocks,
        led_to: r.return!.led_to,
      }));
  }

  return { error: "unknown_tool", name };
}
