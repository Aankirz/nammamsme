import { fetchDocuments, findDocument } from "@/components/lib/documents";
import { CapturePlaceholder } from "@/components/detail/CapturePlaceholder";
import { ConsequenceLadder } from "@/components/detail/ConsequenceLadder";
import { DecisionBar } from "@/components/detail/DecisionBar";
import { DetailHeader } from "@/components/detail/DetailHeader";
import { DocumentMissing } from "@/components/detail/DocumentMissing";
import { FactCards } from "@/components/detail/FactCards";
import { PlainLanguageSection } from "@/components/detail/PlainLanguageSection";
import { RefusalPanel } from "@/components/detail/RefusalPanel";

/** Days-remaining is computed per request. */
export const dynamic = "force-dynamic";

/** Reserved id for the capture placeholder the inbox button routes to. */
const CAPTURE_ID = "new";

interface DocPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocPage({ params }: DocPageProps) {
  const { id } = await params;

  if (id === CAPTURE_ID) {
    return <CapturePlaceholder />;
  }

  const row = findDocument(await fetchDocuments(), id);

  if (!row) {
    return <DocumentMissing />;
  }

  const blocked = row.blockers.length > 0;
  const now = new Date();

  return (
    <div
      className="doc-shell mx-auto flex w-full max-w-screen-sm flex-1 flex-col"
      data-state={blocked ? "refused" : "ready"}
    >
      <DetailHeader docType={row.doc_type} blocked={blocked} />

      <main className="flex-1">
        {blocked && <RefusalPanel blockers={row.blockers} />}

        <FactCards row={row} now={now} />
        <PlainLanguageSection text={row.obligation} />
        <ConsequenceLadder text={row.consequence} />
      </main>

      <DecisionBar blocked={blocked} blockerCount={row.blockers.length} />
    </div>
  );
}
