import type { DocType } from "@/lib/types";
import { DOC_TYPE_LABEL, DOC_TYPE_STAMP } from "@/components/lib/hindi";

interface DocTypeStampProps {
  docType: DocType;
  className?: string;
}

/**
 * The mark stamped on the paper itself. Latin on purpose — a trader reads
 * "GST" on the envelope, and the Hindi name sits next to it in the row.
 */
export function DocTypeStamp({ docType, className = "" }: DocTypeStampProps) {
  return (
    <span
      className={`inline-flex items-center rounded-tag border border-rule-strong px-1.5 py-1 font-mono text-tag font-semibold uppercase text-ink-faint ${className}`}
      aria-label={DOC_TYPE_LABEL[docType]}
    >
      {DOC_TYPE_STAMP[docType]}
    </span>
  );
}
