import Link from "next/link";
import { DetailHeader } from "./DetailHeader";

/**
 * `/doc/new`. STUB — the camera and Vision upload pipeline belong to the
 * ingestion workstream. This exists so the capture button never dead-ends
 * during a live run.
 */
export function CapturePlaceholder() {
  return (
    <div className="doc-shell flex flex-1 flex-col">
      <DetailHeader />

      <main className="flex flex-1 flex-col justify-center px-5 py-12">
        <h1 className="text-display font-bold text-ink">
          दस्तावेज़ की फ़ोटो लें
        </h1>
        <p className="mt-3 max-w-[30ch] text-body text-ink-soft">
          नोटिस, बिल या लाइसेंस — कोई भी काग़ज़ सीधा कैमरे से। मुड़ा हुआ या कम
          रोशनी वाला भी चलेगा।
        </p>

        <ol className="mt-8 flex flex-col gap-4">
          {[
            "पूरा पन्ना फ़्रेम में रखिए",
            "फ़ोटो खींचिए",
            "हम कितना, कब तक और किसने भेजा — निकाल देंगे",
          ].map((step, index) => (
            <li key={index} className="flex gap-4">
              <span className="numerals grid size-8 shrink-0 place-items-center rounded-full bg-ink text-label font-bold text-ink-invert">
                {index + 1}
              </span>
              <span className="text-body text-ink">{step}</span>
            </li>
          ))}
        </ol>

        <Link
          href="/"
          className="press-on-tap mt-10 flex min-h-14 items-center justify-center rounded-card border-2 border-ink px-5 text-lead font-bold text-ink"
        >
          वापस सूची पर
        </Link>
      </main>
    </div>
  );
}
