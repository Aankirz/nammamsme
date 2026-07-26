import Link from "next/link";
import { DetailHeader } from "./DetailHeader";

/** The id is not in the table — or the API is not up yet. Never a crash. */
export function DocumentMissing() {
  return (
    <div className="doc-shell flex flex-1 flex-col">
      <DetailHeader />

      <main className="flex flex-1 flex-col justify-center px-5 py-12">
        <h1 className="text-display font-bold text-ink">
          यह दस्तावेज़ नहीं मिला
        </h1>
        <p className="mt-3 max-w-[30ch] text-body text-ink-soft">
          हो सकता है यह हटा दिया गया हो। सूची पर वापस जाकर दोबारा देखिए।
        </p>

        <Link
          href="/"
          className="press-on-tap mt-8 flex min-h-14 items-center justify-center rounded-card bg-ink px-5 text-lead font-bold text-ink-invert shadow-lift"
        >
          वापस सूची पर
        </Link>
      </main>
    </div>
  );
}
