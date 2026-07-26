import { fetchDocuments, sortByDeadline } from "@/components/lib/documents";
import { groupRows } from "@/components/lib/returns";
import { DocumentTable } from "@/components/inbox/DocumentTable";
import { FirstAction } from "@/components/inbox/FirstAction";
import { countAccuracy, SessionNote } from "@/components/inbox/SessionNote";
import { Standing } from "@/components/inbox/Standing";
import { PAGE } from "@/components/inbox/styles";
import { Shell } from "@/components/shell/Shell";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const now = new Date();
  const rows = sortByDeadline(await fetchDocuments());
  const { obligations } = groupRows(rows, now);

  return (
    <Shell now={now}>
      <div style={PAGE}>
        <FirstAction rows={rows} now={now} />
        <Standing rows={rows} now={now} />
        <DocumentTable rows={obligations} now={now} />
        <SessionNote counts={countAccuracy(rows)} />
      </div>
    </Shell>
  );
}
