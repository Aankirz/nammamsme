import Link from "next/link";

/** The id is not in the table, or the API is not up. Never a crash. */
export function DocumentMissing() {
  return (
    <div className="w-full max-w-[var(--content-max)] px-8 pb-16 pt-12">
      <p className="eyebrow">Not found</p>

      <h1 className="mt-3 max-w-[26ch] text-2xl font-semibold text-ink">
        That document is not in this file.
      </h1>

      <p className="mt-3 max-w-[54ch] text-base text-ink-muted">
        It may have been reset, or the link may be out of date. Everything still in the
        file is listed on the left.
      </p>

      <p className="mt-8">
        <Link
          href="/"
          className="inline-block rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-invert transition-[opacity,transform] duration-150 ease-[var(--ease-out)] hover:opacity-90 active:scale-[0.99]"
        >
          Back to the file
        </Link>
      </p>
    </div>
  );
}
