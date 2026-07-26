import Link from "next/link";

/**
 * The only way paper gets in. Deliberately the largest tap target on the
 * screen and the only ink-black surface in the app.
 *
 * STUB: routes to `/doc/new`, which explains the capture flow. The camera and
 * upload pipeline belong to the ingestion workstream.
 */
export function CaptureBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-screen-sm">
      <div className="h-10 bg-gradient-to-t from-paper to-transparent" />
      <div className="pointer-events-auto bg-paper px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
        <Link
          href="/doc/new"
          className="press-on-tap flex min-h-16 w-full items-center justify-center gap-3 rounded-panel bg-ink px-6 py-4 text-ink-invert shadow-lift transition-transform"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-7 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.9l1.3-2h6.6l1.3 2h1.9A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />
            <circle cx="12" cy="13" r="3.6" />
          </svg>
          <span className="text-lead font-bold">दस्तावेज़ की फ़ोटो लें</span>
        </Link>
      </div>
    </div>
  );
}
