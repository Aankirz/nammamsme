import { fetchDocuments, sortByDeadline } from "@/components/lib/documents";
import { computeExposure } from "@/components/lib/exposure";
import { AppHeader } from "@/components/inbox/AppHeader";
import { CaptureBar } from "@/components/inbox/CaptureBar";
import { ExposureHeadline } from "@/components/inbox/ExposureHeadline";
import { InboxEmpty } from "@/components/inbox/InboxEmpty";
import { ObligationList } from "@/components/inbox/ObligationList";

/** Deadlines are relative to now, so this page is never prerendered. */
export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const now = new Date();
  const rows = await fetchDocuments();
  const exposure = computeExposure(rows, now);
  const sorted = sortByDeadline(rows);

  return (
    <>
      <main className="mx-auto w-full max-w-screen-sm flex-1 pb-32">
        <AppHeader today={now} />

        {sorted.length === 0 ? (
          <InboxEmpty />
        ) : (
          <>
            <ExposureHeadline exposure={exposure} />
            <ObligationList rows={sorted} now={now} />
          </>
        )}
      </main>

      <CaptureBar />
    </>
  );
}
