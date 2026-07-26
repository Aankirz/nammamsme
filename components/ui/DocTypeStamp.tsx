import type { DocType } from "@/lib/types";
import { DOC_TYPE_LABEL, DOC_TYPE_STAMP } from "@/components/lib/copy";

interface DocTypeStampProps {
  docType: DocType;
  className?: string;
}

/** The mark stamped on the paper itself, in the corner of a row or a header. */
export function DocTypeStamp({ docType, className = "" }: DocTypeStampProps) {
  return (
    <span
      className={`numerals inline-flex items-center rounded-sm border border-rule-strong px-1.5 py-px font-mono text-xs font-semibold tracking-[0.08em] text-ink-muted ${className}`}
      title={DOC_TYPE_LABEL[docType]}
    >
      {DOC_TYPE_STAMP[docType]}
    </span>
  );
}
