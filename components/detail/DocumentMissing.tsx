import Link from "next/link";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";

export function DocumentMissing() {
  return (
    <div className="mx-auto w-full max-w-[840px] py-16">
      <Blueprint className="p-[var(--space-8)]">
        <Kicker style={{ letterSpacing: "0.18em" }}>Not found</Kicker>

        <h1 className="mt-1.5 mb-[var(--space-6)] max-w-[26ch] text-[44px] leading-none font-semibold">
          That document is not in this file
        </h1>

        <p className="max-w-[54ch] text-[14px] leading-[1.55] opacity-70 [text-wrap:pretty]">
          It may have been reset, or the link may be out of date. Everything still in
          the file is listed on the inbox.
        </p>

        <p className="mt-[var(--space-8)]">
          <Link href="/" className="btn btn-primary">
            Back to the file
          </Link>
        </p>
      </Blueprint>
    </div>
  );
}
