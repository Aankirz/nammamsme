import { fetchDocuments, sortByDeadline } from "@/components/lib/documents";
import { groupRows } from "@/components/lib/returns";
import { DocumentTable } from "@/components/inbox/DocumentTable";
import { HeadlineRow } from "@/components/inbox/HeadlineRow";
import { ReturnsPlate } from "@/components/inbox/ReturnsPlate";
import { countAccuracy, Scoreboard } from "@/components/inbox/Scoreboard";
import { HEADING, KICKER, PAGE } from "@/components/inbox/styles";
import { Shell } from "@/components/shell/Shell";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const now = new Date();
  const rows = sortByDeadline(await fetchDocuments());
  const { obligations, returns } = groupRows(rows, now);

  return (
    <Shell now={now}>
      <div style={PAGE}>
        <div
          className="flex flex-wrap items-end justify-between"
          style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}
        >
          <div>
            <div style={{ ...KICKER, marginBottom: "3px" }}>Inbox</div>
            <h1 style={{ ...HEADING, margin: 0, fontSize: "36px", lineHeight: 1 }}>
              Everything you owe, and everything you are owed
            </h1>
          </div>
        </div>

        <HeadlineRow rows={rows} now={now} />
        <ReturnsPlate returns={returns} now={now} />
        <DocumentTable rows={obligations} now={now} />
        <Scoreboard counts={countAccuracy(rows)} />
      </div>
    </Shell>
  );
}
