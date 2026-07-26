interface PlainLanguageSectionProps {
  /** `obligation` — the plain-Hindi explanation of what the paper says. */
  text: string;
}

/** यह क्या है — what the document actually alleges, in words he uses. */
export function PlainLanguageSection({ text }: PlainLanguageSectionProps) {
  const paragraphs = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section aria-labelledby="explanation-heading" className="px-4 pt-8">
      <h2
        id="explanation-heading"
        className="text-label font-semibold uppercase tracking-[0.1em] text-ink-faint"
      >
        यह क्या है
      </h2>

      <div className="mt-2 border-l-2 border-ink pl-4">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-body text-ink [&:not(:first-child)]:mt-3"
            >
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-body text-ink-faint">
            इस दस्तावेज़ का ब्यौरा अभी तैयार नहीं हुआ है।
          </p>
        )}
      </div>
    </section>
  );
}
