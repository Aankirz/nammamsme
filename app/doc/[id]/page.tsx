import Link from "next/link";
import {
  fetchAllRows,
  findDocument,
  inTheFile,
  sortByDeadline,
} from "@/components/lib/documents";
import { indexRates } from "@/components/lib/rate-index";
import { CapturePlaceholder } from "@/components/detail/CapturePlaceholder";
import { DocumentDetail } from "@/components/detail/DocumentDetail";
import { DocumentMissing } from "@/components/detail/DocumentMissing";
import { ReturnDetail } from "@/components/detail/ReturnDetail";
import { Shell } from "@/components/shell/Shell";

export const dynamic = "force-dynamic";

const CAPTURE_ID = "new";

interface DocPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocPage({ params }: DocPageProps) {
  const { id } = await params;
  const now = new Date();

  if (id === CAPTURE_ID) {
    return (
      <Shell now={now}>
        <CapturePlaceholder />
      </Shell>
    );
  }

  const all = await fetchAllRows();
  const rows = sortByDeadline(inTheFile(all));
  const rates = indexRates(all);
  const row = findDocument(rows, id);

  const isReturn = row?.doc_type === "gst_return";
  const ledTo = row?.return?.led_to ?? null;
  const notice = isReturn && ledTo ? findDocument(rows, ledTo) : null;

  return (
    <Shell now={now}>
      <div className="mx-auto w-full max-w-[1280px] px-[var(--space-6)] pt-[var(--space-6)] pb-[72px]">
        <p className="mb-[var(--space-4)]">
          <Link href="/" className="btn btn-ghost text-[12px]">
            &larr; Inbox
          </Link>
        </p>

        {row && isReturn ? (
          <ReturnDetail row={row} notice={notice} now={now} />
        ) : row ? (
          <DocumentDetail row={row} now={now} rates={rates} />
        ) : (
          <DocumentMissing />
        )}
      </div>
    </Shell>
  );
}
