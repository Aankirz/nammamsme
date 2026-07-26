import { db, type StoredRow } from "./db";
import { assembleEvidence } from "./evidence";
import { BUSINESS } from "./business";

export type FieldState = "filled" | "your_choice" | "not_established";

export interface FormField {
  ref: string;
  label: string;
  value: string;
  state: FieldState;
  note?: string;
  multiline?: boolean;
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface FilledForm {
  form: string;
  title: string;
  rule: string;
  documentId: string;
  portalPath: string;
  sections: FormSection[];
  attachments: string[];
  filledCount: number;
  choiceCount: number;
  missingCount: number;
}

function rupees(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function financialYear(periodStart: string): string {
  const year = Number(periodStart.slice(0, 4));
  const month = Number(periodStart.slice(5, 7));
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

function referenceOf(row: StoredRow): string | null {
  const found = row.obligation.match(/Reference\s+([A-Z0-9]+)/i);
  return found ? found[1] : null;
}

function tally(sections: FormSection[]) {
  const all = sections.flatMap((s) => s.fields);
  return {
    filledCount: all.filter((f) => f.state === "filled").length,
    choiceCount: all.filter((f) => f.state === "your_choice").length,
    missingCount: all.filter((f) => f.state === "not_established").length,
  };
}

export async function fillDrc06(documentId: string): Promise<FilledForm | null> {
  const row = await db.getDocument(documentId);
  if (!row || row.doc_type !== "gst_notice") return null;

  const notice = row.notice;
  const blocked = row.blockers.length > 0;

  const all = await db.listDocuments();
  const evidence = notice
    ? assembleEvidence(
        {
          claimed_itc: notice.claimed_itc,
          matched_itc: notice.matched_itc,
          periodStart: notice.period_start,
          periodEnd: notice.period_end,
        },
        all,
      )
    : null;

  const reference = referenceOf(row);

  const reply =
    notice && evidence && !blocked
      ? [
          `The input tax credit of ${rupees(evidence.claimedTotal)} claimed in GSTR-3B for the period ${longDate(notice.period_start)} to ${longDate(notice.period_end)} is supported by ${evidence.rows.length} purchase invoices, listed at serial 6 below and enclosed.`,
          ``,
          `The invoices enclosed total ${rupees(evidence.claimedTotal)}, which equals the credit claimed. Of this, ${rupees(notice.matched_itc)} is reflected in GSTR-2B and is not in dispute.`,
          ``,
          `The balance of ${rupees(notice.unmatched_itc)} arises from ${evidence.rows.filter((r) => r.gst > 0).length > 0 ? "invoices" : "supplies"} on which tax was charged by the supplier and paid by us at the time of purchase, as evidenced by the enclosed invoices. A supplier's failure to report an outward supply in GSTR-1 is not within the purchaser's control, and the credit is not deniable on that ground alone where the purchase, payment and receipt of goods are established.`,
          ``,
          `We request that the proceedings be dropped. In the alternative, we request an opportunity of personal hearing before any order is passed.`,
        ].join("\n")
      : "";

  const sections: FormSection[] = [
    {
      title: "Taxpayer",
      fields: [
        { ref: "1", label: "GSTIN", value: BUSINESS.gstin, state: "filled" },
        { ref: "2", label: "Name", value: BUSINESS.legalName, state: "filled" },
      ],
    },
    {
      title: "The notice you are replying to",
      fields: [
        {
          ref: "3a",
          label: "Reference number of the show cause notice",
          value: reference ?? "",
          state: reference ? "filled" : "not_established",
          note: reference ? undefined : "Copy this from the top of your notice.",
        },
        {
          ref: "3b",
          label: "Date of issue",
          value: row.doc_date ? longDate(row.doc_date) : "",
          state: row.doc_date ? "filled" : "not_established",
        },
        {
          ref: "4",
          label: "Financial year",
          value: notice ? financialYear(notice.period_start) : "",
          state: notice ? "filled" : "not_established",
        },
      ],
    },
    {
      title: "Your reply",
      fields: [
        {
          ref: "5",
          label: "Reply",
          value: reply,
          state: blocked ? "not_established" : reply ? "filled" : "not_established",
          multiline: true,
          note: blocked
            ? "Not written. The figures on this notice could not be established, so there is nothing we will stand behind."
            : undefined,
        },
      ],
    },
    {
      title: "Your decision",
      fields: [
        {
          ref: "7",
          label: "Do you want a personal hearing?",
          value: "Yes",
          state: "your_choice",
          note: "Asking for a hearing costs nothing and keeps the option open. Change it if you disagree.",
        },
      ],
    },
    {
      title: "Verification",
      fields: [
        {
          ref: "8a",
          label: "Name of authorised signatory",
          value: BUSINESS.signatory,
          state: "filled",
        },
        { ref: "8b", label: "Designation", value: BUSINESS.designation, state: "filled" },
        {
          ref: "8c",
          label: "Place",
          value: BUSINESS.place,
          state: "filled",
        },
      ],
    },
  ];

  const attachments = evidence
    ? evidence.rows.map(
        (r, index) =>
          `${index + 1}. ${r.invoice_ref}, ${r.counterparty}, ${longDate(r.doc_date)}, GST ${rupees(r.gst)}`,
      )
    : [];

  return {
    form: "GST DRC-06",
    title: "Reply to the Show Cause Notice",
    rule: "See rule 142(4)",
    documentId: row.id,
    portalPath: "Services → User Services → View Additional Notices and Orders → Reply",
    sections,
    attachments,
    ...tally(sections),
  };
}

export async function fillGstr3b(documentId: string): Promise<FilledForm | null> {
  const row = await db.getDocument(documentId);
  if (!row || row.doc_type !== "gst_return") return null;

  const detail = row.return;
  if (!detail || detail.form !== "GSTR-3B") return null;

  const tax = detail.tax_payable;
  const claimed = detail.itc_claimed;
  const available = detail.itc_available;

  const unknown = (label: string, ref: string, note: string): FormField => ({
    ref,
    label,
    value: "",
    state: "not_established",
    note,
  });

  const sections: FormSection[] = [
    {
      title: "Taxpayer and period",
      fields: [
        { ref: "GSTIN", label: "GSTIN", value: BUSINESS.gstin, state: "filled" },
        { ref: "Name", label: "Legal name", value: BUSINESS.legalName, state: "filled" },
        {
          ref: "Period",
          label: "Return period",
          value: detail.period_label,
          state: "filled",
        },
      ],
    },
    {
      title: "Table 3.1 · Outward supplies",
      fields: [
        tax !== null
          ? {
              ref: "3.1(a)",
              label: "Outward taxable supplies, tax payable",
              value: rupees(tax),
              state: "filled" as FieldState,
              note: "This is the tax figure on record for this period.",
            }
          : unknown(
              "Outward taxable supplies, tax payable",
              "3.1(a)",
              "No tax figure is on record for this period.",
            ),
        unknown(
          "Taxable value of outward supplies",
          "3.1(a) value",
          "Total your sales invoices for this period. We hold purchase bills, not sales.",
        ),
      ],
    },
    {
      title: "Table 4 · Eligible input tax credit",
      fields: [
        claimed !== null
          ? {
              ref: "4(A)(5)",
              label: "All other ITC available",
              value: rupees(claimed),
              state: "filled" as FieldState,
            }
          : unknown("All other ITC available", "4(A)(5)", "Not on record for this period."),
        available !== null && claimed !== null
          ? {
              ref: "4(D)(2)",
              label: "ITC not available, unmatched in GSTR-2B",
              value: rupees(claimed - available),
              state: "filled" as FieldState,
              note:
                claimed - available > 0
                  ? "Claiming this without holding the invoices is what produces a demand notice."
                  : undefined,
            }
          : unknown("ITC not available", "4(D)(2)", "Compare against GSTR-2B on the portal."),
      ],
    },
    {
      title: "Table 6.1 · Payment of tax",
      fields: [
        tax !== null
          ? {
              ref: "6.1",
              label: "Tax paid in cash",
              value: rupees(tax),
              state: "filled" as FieldState,
            }
          : unknown("Tax paid in cash", "6.1", "Not on record for this period."),
        detail.late_fee !== null && detail.late_fee > 0
          ? {
              ref: "6.1 fee",
              label: "Late fee payable",
              value: rupees(detail.late_fee),
              state: "filled" as FieldState,
              note: `${detail.days_late} days late at ₹50 a day. This grows until you file.`,
            }
          : { ref: "6.1 fee", label: "Late fee payable", value: "₹0", state: "filled" as FieldState },
      ],
    },
  ];

  return {
    form: "GSTR-3B",
    title: `Monthly return, ${detail.period_label}`,
    rule: "See rule 61(5)",
    documentId: row.id,
    portalPath: "Returns Dashboard → select period → GSTR-3B → Prepare Online",
    sections,
    attachments: [],
    ...tally(sections),
  };
}

export async function fillForm(documentId: string): Promise<FilledForm | null> {
  const row = await db.getDocument(documentId);
  if (!row) return null;
  if (row.doc_type === "gst_notice") return fillDrc06(documentId);
  if (row.doc_type === "gst_return") return fillGstr3b(documentId);
  return null;
}
