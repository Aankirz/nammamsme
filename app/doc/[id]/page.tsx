import { fetchDocuments, findDocument, sortByDeadline } from "@/components/lib/documents";
import { CapturePlaceholder } from "@/components/detail/CapturePlaceholder";
import { DocumentDetail } from "@/components/detail/DocumentDetail";
import { DocumentMissing } from "@/components/detail/DocumentMissing";
import { Shell } from "@/components/shell/Shell";

/** Days remaining is computed per request. */
export const dynamic = "force-dynamic";

/** Reserved id for the capture placeholder the rail links to. */
const CAPTURE_ID = "new";

interface DocPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocPage({ params }: DocPageProps) {
  const { id } = await params;
  const now = new Date();
  const rows = sortByDeadline(await fetchDocuments());
  const row = id === CAPTURE_ID ? null : findDocument(rows, id);

  return (
    <Shell rows={rows} now={now} selectedId={row?.id}>
      {id === CAPTURE_ID ? (
        <CapturePlaceholder />
      ) : row ? (
        <DocumentDetail row={row} now={now} />
      ) : (
        <DocumentMissing />
      )}
    </Shell>
  );
}
