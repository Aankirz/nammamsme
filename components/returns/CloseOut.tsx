import Link from "next/link";
import { returnStatus } from "@/components/lib/returns";
import { Kicker } from "@/components/ui/Kicker";
import { GHOST_BUTTON, PRIMARY_BUTTON } from "@/components/ui/buttons";
import { formTitle, returnCountPhrase } from "./copy";
import { monthsSpanned, type HistoryEntry } from "./history";

interface CloseOutProps {
  open: readonly HistoryEntry[];
  now: Date;
}

export function CloseOut({ open, now }: CloseOutProps) {
  const first = open[0];

  return (
    <section
      aria-labelledby="next-heading"
      className="mt-[calc(var(--space-8)*1.8)] border-t border-rule pt-[var(--space-6)]"
    >
      <Kicker as="h2" id="next-heading" className="mb-[var(--space-3)]">
        What to do next
      </Kicker>

      {first ? (
        <>
          <p className="m-0 max-w-[62ch] text-[15px] leading-[1.5] [text-wrap:pretty]">
            {returnCountPhrase(open.length)}. Start with the{" "}
            {formTitle(
              first.detail.form,
              monthsSpanned(first.startIso, first.endIso),
            ).toLowerCase()}{" "}
            for{" "}
            {first.detail.period_label || "the oldest open period"},{" "}
            {returnStatus(first.row, now).phrase.toLowerCase()}.
          </p>

          <div className="mt-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-3)]">
            <Link
              href={`/doc/${encodeURIComponent(first.row.id)}`}
              className={PRIMARY_BUTTON}
            >
              Open that return
            </Link>

            <Link href="/" className={GHOST_BUTTON}>
              Back to the inbox
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="m-0 max-w-[62ch] text-[15px] leading-[1.5]">
            Every return in this file is filed. Nothing is running against you here.
          </p>

          <div className="mt-[var(--space-4)]">
            <Link href="/" className={PRIMARY_BUTTON}>
              Back to the inbox
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
