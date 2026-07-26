import { Fragment } from "react";
import type { FilledForm as Filled } from "@/lib/forms";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";
import { CopyButton } from "./CopyButton";
import { AttachmentsRow, FieldRow, SectionBand } from "./FormFieldRow";

interface FilledFormProps {
  filled: Filled;
  lede?: string;
}

const HEADING_ID = "filled-form-heading";

const ATTACHMENT_SERIAL = "6";

const DEFAULT_LEDE =
  "The form, already completed. Go down it line by line and copy each value into the portal.";

const FOOTNOTE =
  "Nothing here is submitted for you. There is no filing interface to the GST portal worth putting your name through, so the work stops at a form you can read, check and paste.";

const TONE = {
  accent: "var(--color-accent-800)",
  stamp: "var(--stamp)",
} as const;

type Tone = keyof typeof TONE;

function Tally({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone?: Tone;
}) {
  const color = tone && count > 0 ? TONE[tone] : undefined;

  return (
    <div className="border-r border-rule px-[var(--space-4)] py-[var(--space-3)] last:border-r-0">
      <p
        className="numerals mb-0.5 font-[family-name:var(--font-heading)] text-[26px] leading-[1.05] font-semibold"
        style={{ color }}
      >
        {count}
      </p>
      <Kicker style={{ letterSpacing: "0.12em" }}>{label}</Kicker>
    </div>
  );
}

export function FilledForm({ filled, lede = DEFAULT_LEDE }: FilledFormProps) {
  const { attachments } = filled;

  return (
    <Blueprint as="section" ariaLabelledBy={HEADING_ID}>
      <header className="border-b border-rule px-[var(--space-6)] py-[var(--space-6)]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-[var(--space-4)] gap-y-1">
          <Kicker style={{ letterSpacing: "0.18em", opacity: 0.6 }}>
            Form {filled.form}
          </Kicker>
          <span className="text-[11px] opacity-45">{filled.rule}</span>
        </div>

        <h2
          id={HEADING_ID}
          className="mt-1 mb-[var(--space-2)] max-w-[24ch] text-[30px] leading-[1.04] font-semibold"
        >
          {filled.title}
        </h2>

        <p className="mb-0 max-w-[62ch] text-[13.5px] leading-[1.5] opacity-65 [text-wrap:pretty]">
          {lede}
        </p>
      </header>

      <div className="grid grid-cols-3 border-b border-rule">
        <Tally count={filled.filledCount} label="written for you" />
        <Tally count={filled.choiceCount} label="your call" tone="accent" />
        <Tally count={filled.missingCount} label="you supply" tone="stamp" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-[var(--space-3)] border-b border-rule px-[var(--space-6)] py-[var(--space-4)]">
        <div className="min-w-0">
          <Kicker>Where this goes on the portal</Kicker>
          <p className="mt-1 mb-0 text-[13.5px] leading-[1.45] [overflow-wrap:anywhere]">
            {filled.portalPath}
          </p>
        </div>

        <CopyButton text={filled.portalPath} label="Copy the path" />
      </div>

      <div className="grid grid-cols-[minmax(3.25rem,max-content)_minmax(0,1fr)]">
        {filled.sections.map((section) => (
          <Fragment key={section.title}>
            <SectionBand title={section.title} />

            {section.fields.map((field) => (
              <FieldRow key={field.ref} field={field} />
            ))}

            {attachments.length > 0 && section.fields.some((f) => f.multiline) && (
              <>
                <SectionBand title="Documents uploaded" />
                <AttachmentsRow
                  serial={ATTACHMENT_SERIAL}
                  attachments={attachments}
                />
              </>
            )}
          </Fragment>
        ))}
      </div>

      <p className="mb-0 px-[var(--space-6)] py-[var(--space-4)] text-[11.5px] leading-[1.5] opacity-50 [text-wrap:pretty]">
        {FOOTNOTE}
      </p>
    </Blueprint>
  );
}
