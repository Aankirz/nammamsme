import type { BlockerKind } from "@/lib/types";
import type { DocumentRow } from "@/components/lib/documents";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";

interface Check {
  kind: BlockerKind;
  label: string;
  passed: string;
}

const CHECKS: readonly Check[] = [
  {
    kind: "amount_disagreement",
    label: "Both reads agree on every number",
    passed: "Compared as plain numbers, so punctuation and spacing cannot hide a difference",
  },
  {
    kind: "missing_annexure",
    label: "Every page the document refers to is here",
    passed: "Nothing it points at is missing from the upload",
  },
  {
    kind: "missing_field",
    label: "Nothing required is missing",
    passed: "Amount, deadline, sender and reference are all present",
  },
];

interface ChecksPanelProps {
  row: DocumentRow;
}

export function ChecksPanel({ row }: ChecksPanelProps) {
  return (
    <section aria-labelledby="checks-heading">
      <Blueprint className="p-[var(--space-6)]">
        <Kicker as="h2" id="checks-heading" className="mb-[var(--space-4)]">
          Checks before anything is filed
        </Kicker>

        {CHECKS.map((check) => {
          const failure = row.blockers.find((blocker) => blocker.kind === check.kind);

          return (
            <div
              key={check.kind}
              className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-[11px] border-b border-rule py-2"
            >
              <span
                aria-hidden="true"
                className={`text-[13px] ${failure ? "text-stamp" : "text-[var(--color-accent-700)]"}`}
              >
                {failure ? "✕" : "✓"}
              </span>

              <div className="min-w-0">
                <p className="text-[13px]">
                  {check.label}
                  <span className="sr-only">{failure ? ": failed" : ": passed"}</span>
                </p>
                <p className={`text-[11.5px] ${failure ? "text-stamp" : "opacity-50"}`}>
                  {failure ? failure.detail : check.passed}
                </p>
              </div>
            </div>
          );
        })}

        <p className="mt-[var(--space-4)] text-[11.5px] opacity-50 [text-wrap:pretty]">
          Confidence here is these three yes or no checks, not a score the model
          reported about itself.
        </p>
      </Blueprint>
    </section>
  );
}
