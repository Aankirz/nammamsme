import type { FieldState, FormField } from "@/lib/forms";
import { Kicker } from "@/components/ui/Kicker";
import { CopyButton } from "./CopyButton";

const SERIAL_CELL =
  "border-r border-b border-rule px-[var(--space-3)] py-[var(--space-4)]";

const SERIAL_TEXT =
  "numerals font-[family-name:var(--font-heading)] text-[14px] leading-[1.25] font-semibold opacity-70";

const BODY_CELL = "min-w-0 border-b border-rule px-[var(--space-4)] py-[var(--space-4)]";

const LABEL = "text-[11px] tracking-[0.1em] uppercase opacity-55";

const EDGE: Record<FieldState, string> = {
  filled: "transparent",
  your_choice: "var(--color-accent)",
  not_established: "var(--stamp)",
};

const TAG: Record<FieldState, string | null> = {
  filled: null,
  your_choice: "Your call",
  not_established: "You supply this",
};

const TAG_CLASS: Record<FieldState, string> = {
  filled: "",
  your_choice: "tag tag-outline text-[10px] tracking-[0.08em] uppercase",
  not_established:
    "tag border border-stamp text-stamp text-[10px] tracking-[0.08em] uppercase",
};

const NOTE_CLASS: Record<FieldState, string> = {
  filled: "opacity-60",
  your_choice: "text-[var(--color-accent-800)]",
  not_established: "text-stamp",
};

function Serial({ serial, state }: { serial: string; state: FieldState }) {
  return (
    <div className={SERIAL_CELL} style={{ borderLeft: `3px solid ${EDGE[state]}` }}>
      <span className={SERIAL_TEXT}>{serial}</span>
    </div>
  );
}

function Blank() {
  return (
    <p className="mt-[var(--space-3)] mb-0 h-[20px] max-w-[34ch] border-b border-dashed border-stamp-rule">
      <span className="sr-only">Left blank. Nothing is established for this field.</span>
    </p>
  );
}

function Value({ value }: { value: string }) {
  return (
    <p className="numerals mt-[var(--space-2)] mb-0 text-[15.5px] leading-[1.4] [overflow-wrap:anywhere]">
      {value}
    </p>
  );
}

function Reply({ value }: { value: string }) {
  const paragraphs = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="mt-[var(--space-3)] border border-rule bg-paper-sunk p-[var(--space-4)]">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className="max-w-[74ch] text-[14px] leading-[1.62] last:mb-0 [text-wrap:pretty]"
        >
          {paragraph}
        </p>
      ))}

      <CopyButton
        text={value}
        label="Copy the whole reply"
        done="The whole reply is on your clipboard"
        className="btn btn-primary btn-block mt-[var(--space-4)]"
      />
    </div>
  );
}

export function SectionBand({ title }: { title: string }) {
  return (
    <div
      className="col-span-2 border-b border-rule px-[var(--space-4)] py-[var(--space-2)]"
      style={{ backgroundColor: "var(--color-accent-100)" }}
    >
      <Kicker style={{ letterSpacing: "0.14em", opacity: 0.75 }}>{title}</Kicker>
    </div>
  );
}

export function FieldRow({ field }: { field: FormField }) {
  const missing = field.state === "not_established";
  const tag = TAG[field.state];

  return (
    <>
      <Serial serial={field.ref} state={field.state} />

      <div className={BODY_CELL}>
        <div className="flex flex-wrap items-start justify-between gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
          <span className="flex min-w-0 flex-wrap items-center gap-[var(--space-2)]">
            <span className={LABEL}>{field.label}</span>
            {tag && <span className={TAG_CLASS[field.state]}>{tag}</span>}
          </span>

          {!missing && !field.multiline && <CopyButton text={field.value} />}
        </div>

        {missing ? (
          <Blank />
        ) : field.multiline ? (
          <Reply value={field.value} />
        ) : (
          <Value value={field.value} />
        )}

        {field.note && (
          <p
            className={`mt-[var(--space-3)] mb-0 max-w-[68ch] text-[12px] leading-[1.5] [text-wrap:pretty] ${NOTE_CLASS[field.state]}`}
          >
            {field.note}
          </p>
        )}
      </div>
    </>
  );
}

export function AttachmentsRow({
  serial,
  attachments,
}: {
  serial: string;
  attachments: readonly string[];
}) {
  const joined = attachments.join("\n");

  return (
    <>
      <Serial serial={serial} state="filled" />

      <div className={BODY_CELL}>
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
          <span className={LABEL}>List of documents uploaded</span>
          <span className="numerals text-[11px] opacity-55">
            {attachments.length} enclosed
          </span>
        </div>

        <ul className="mt-[var(--space-3)] border border-rule">
          {attachments.map((line) => (
            <li
              key={line}
              className="numerals border-b border-rule px-[var(--space-3)] py-[var(--space-2)] text-[12.5px] leading-[1.45] last:border-b-0 [overflow-wrap:anywhere]"
            >
              {line}
            </li>
          ))}
        </ul>

        <CopyButton
          text={joined}
          label={`Copy all ${attachments.length} lines`}
          done={`All ${attachments.length} lines copied`}
          className="btn btn-secondary btn-block mt-[var(--space-3)]"
        />
      </div>
    </>
  );
}
