import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";
import { inRupees } from "@/components/lib/money";

interface PlainWordsProps {
  heading: string;
  headingId: string;
  paragraphs: readonly string[];
  empty: string;
  footnote?: string | null;
}

export function PlainWords({
  heading,
  headingId,
  paragraphs,
  empty,
  footnote,
}: PlainWordsProps) {
  return (
    <section aria-labelledby={headingId}>
      <Kicker as="h2" id={headingId} className="mb-[var(--space-3)]">
        {heading}
      </Kicker>

      <Blueprint className="p-[var(--space-6)]">
        <div className="grid gap-[var(--space-4)]">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="m-0 max-w-[72ch] text-[14.5px] leading-[1.6] [text-wrap:pretty]"
              >
                {inRupees(paragraph)}
              </p>
            ))
          ) : (
            <p className="m-0 text-[14.5px] leading-[1.6] opacity-60">{empty}</p>
          )}
        </div>

        {footnote && (
          <p className="mt-[var(--space-6)] border-t border-rule pt-[var(--space-4)] text-[11.5px] opacity-50 [text-wrap:pretty]">
            {footnote}
          </p>
        )}
      </Blueprint>
    </section>
  );
}
