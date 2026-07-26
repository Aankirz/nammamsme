import { fetchDocuments, sortByDeadline } from "@/components/lib/documents";
import { groupRows } from "@/components/lib/returns";
import { EmptyDetail } from "@/components/detail/EmptyDetail";
import { Shell } from "@/components/shell/Shell";

export const dynamic = "force-dynamic";

export default async function CaseFilePage() {
  const now = new Date();
  const rows = sortByDeadline(await fetchDocuments());
  const { obligations, returns } = groupRows(rows, now);

  return (
    <Shell rows={rows} now={now}>
      <EmptyDetail next={obligations[0] ?? returns[0] ?? null} now={now} />
    </Shell>
  );
}
