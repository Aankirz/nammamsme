import { fetchDocuments, findDocument, sortByDeadline } from "@/components/lib/documents";
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
  const rows = sortByDeadline(await fetchDocuments());
  const row = id === CAPTURE_ID ? null : findDocument(rows, id);

  const isReturn = row?.doc_type === "gst_return";
  const ledTo = row?.return?.led_to ?? null;
  const notice = isReturn && ledTo ? findDocument(rows, ledTo) : null;

  return (
    <Shell rows={rows} now={now} selectedId={row?.id}>
      {id === CAPTURE_ID ? (
        <CapturePlaceholder />
      ) : row && isReturn ? (
        <ReturnDetail row={row} notice={notice} now={now} />
      ) : row ? (
        <DocumentDetail row={row} now={now} />
      ) : (
        <DocumentMissing />
      )}
    </Shell>
  );
}
