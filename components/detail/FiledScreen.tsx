import Link from "next/link";
import { formatRupees } from "@/components/lib/money";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";
import type { ReplyDraft } from "./EvidenceTable";

interface FiledScreenProps {
  arn: string | null;
  filedAt: string;
  draft: ReplyDraft | null;
}

function linesFor(draft: ReplyDraft | null): string[] {
  if (draft === null) return ["The reply was filed on the facts on this page"];

  const lines: string[] = [];
  if (draft.rows.length > 0) {
    lines.push(`${draft.rows.length} purchase bills attached as Annexure 1`);
  }
  lines.push(`${formatRupees(draft.matchedTotal)} of matched credit defended`);
  lines.push(`${formatRupees(draft.gap)} stated openly as unmatched`);
  return lines;
}

export function FiledScreen({ arn, filedAt, draft }: FiledScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[840px] py-16">
      <Blueprint className="p-[var(--space-8)]">
        <Kicker className="tracking-[0.18em]">Filed · Form GST DRC-06</Kicker>

        <h1 className="mt-1.5 mb-[var(--space-6)] text-[44px] leading-none font-semibold">
          Your reply has been filed
        </h1>

        <div className="mb-[var(--space-6)] grid grid-cols-2 border border-rule">
          <div className="border-r border-rule p-[var(--space-6)]">
            <Kicker>Reference number</Kicker>
            <p className="numerals mt-1.5 font-mono text-[23px] font-semibold">
              {arn ?? "None returned"}
            </p>
          </div>
          <div className="p-[var(--space-6)]">
            <Kicker>Filed at</Kicker>
            <p className="numerals mt-1.5 text-[23px] font-semibold">{filedAt}</p>
          </div>
        </div>

        <ul className="grid gap-2.5 text-[14px] leading-[1.5]">
          {linesFor(draft).map((line) => (
            <li key={line}>
              <span aria-hidden="true" className="text-[var(--color-accent-700)]">
                ✓
              </span>{" "}
              {line}
            </li>
          ))}
        </ul>

        <div className="mt-[var(--space-8)] flex flex-wrap gap-[var(--space-3)]">
          <Link href="/" className="btn btn-primary">
            Back to the file
          </Link>
        </div>
      </Blueprint>
    </div>
  );
}
