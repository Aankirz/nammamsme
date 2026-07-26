import Link from "next/link";
import type { DocumentRow } from "@/components/lib/documents";
import { DOC_TYPE_LABEL } from "@/components/lib/copy";
import { urgencyFor } from "@/components/lib/urgency";

interface EmptyDetailProps {
  /** The most urgent row, so this view can point straight at it. */
  next: DocumentRow | null;
  now: Date;
}

function Steps() {
  return (
    <dl className="mt-8 max-w-[62ch] border-t border-rule">
      {[
        [
          "It reads the page",
          "Every figure is pulled off the document twice and the two readings have to agree before anything is shown.",
        ],
        [
          "It shows you where",
          "Any amount or date can be selected to highlight the exact block of the page it came from.",
        ],
        [
          "It refuses when it cannot be sure",
          "If a figure will not stand up, filing is locked and the reason is stated. Nothing is guessed.",
        ],
      ].map(([term, detail]) => (
        <div key={term} className="border-b border-rule py-4">
          <dt className="text-base font-semibold text-ink">{term}</dt>
          <dd className="mt-1 text-base text-ink-muted">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The detail pane before anything is selected. It teaches what this is for and
 * ends in the one document most worth opening.
 */
export function EmptyDetail({ next, now }: EmptyDetailProps) {
  const urgency = next ? urgencyFor(next, now) : null;

  return (
    <div className="w-full max-w-[var(--content-max)] px-8 pb-16 pt-12">
      <p className="eyebrow">Case file</p>

      <h1 className="mt-3 max-w-[24ch] text-2xl font-semibold text-ink">
        {next
          ? "Open a document on the left."
          : "Nothing has been read into this file yet."}
      </h1>

      <p className="mt-3 max-w-[58ch] text-base text-ink-muted">
        {next
          ? "Each row is one obligation: what it costs, when it bites, and what happens if it is left alone."
          : "Add a notice, an invoice or a licence and its amount, deadline and consequence appear in the rail."}
      </p>

      <Steps />

      {next && urgency ? (
        <p className="mt-8">
          <Link
            href={`/doc/${encodeURIComponent(next.id)}`}
            className="inline-block rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-invert transition-[opacity,transform] duration-150 ease-[var(--ease-out)] hover:opacity-90 active:scale-[0.99]"
          >
            Open the {DOC_TYPE_LABEL[next.doc_type].toLowerCase()}, {urgency.phrase.toLowerCase()}
          </Link>
        </p>
      ) : (
        <p className="mt-8">
          <Link
            href="/doc/new"
            className="inline-block rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-invert transition-[opacity,transform] duration-150 ease-[var(--ease-out)] hover:opacity-90 active:scale-[0.99]"
          >
            Add a document
          </Link>
        </p>
      )}
    </div>
  );
}
