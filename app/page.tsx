import { fetchDocuments, sortByDeadline } from "@/components/lib/documents";
import { EmptyDetail } from "@/components/detail/EmptyDetail";
import { Shell } from "@/components/shell/Shell";

/** Deadlines are relative to now, so this page is never prerendered. */
export const dynamic = "force-dynamic";

export default async function CaseFilePage() {
  const now = new Date();
  const rows = sortByDeadline(await fetchDocuments());

  return (
    <Shell rows={rows} now={now}>
      <EmptyDetail next={rows[0] ?? null} now={now} />
    </Shell>
  );
}
