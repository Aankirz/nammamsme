import Link from "next/link";
import type { DocType } from "@/lib/types";
import { DOC_TYPE_LABEL } from "@/components/lib/hindi";

interface DetailHeaderProps {
  docType?: DocType;
  blocked?: boolean;
}

export function DetailHeader({ docType, blocked = false }: DetailHeaderProps) {
  return (
    <header
      className={`flex items-center gap-3 border-b px-4 py-3 ${
        blocked ? "border-danger-rule" : "border-rule"
      }`}
    >
      <Link
        href="/"
        aria-label="वापस सूची पर"
        className="press-on-tap grid size-11 shrink-0 place-items-center rounded-full border border-rule-strong bg-paper-raised text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>

      <p className="truncate text-label font-semibold uppercase tracking-[0.1em] text-ink-faint">
        {docType ? DOC_TYPE_LABEL[docType] : "दस्तावेज़"}
      </p>
    </header>
  );
}
