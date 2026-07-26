import Link from "next/link";
import type { DocumentRow } from "@/components/lib/documents";
import { formatRupees } from "@/components/lib/money";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { Blueprint } from "./Blueprint";
import { firstAction, nextReturn, otherLateReturns, type ReturnMention } from "./first";
import { ASIDE, BODY, KICKER, LEAD, NOTE, SECOND_FIGURE } from "./styles";

interface FirstActionProps {
  rows: readonly DocumentRow[];
  now: Date;
}

function Mention({ mention }: { mention: ReturnMention }) {
  return (
    <Link
      href={`/doc/${encodeURIComponent(mention.row.id)}`}
      style={{ color: "inherit", textDecoration: "none", borderBottom: "1px solid currentColor" }}
    >
      {mention.label}
    </Link>
  );
}

export function FirstAction({ rows, now }: FirstActionProps) {
  const action = firstAction(rows, now);

  if (action === null) {
    return (
      <section style={{ marginBottom: "calc(var(--space-8) * 1.6)" }}>
        <div style={{ ...KICKER, marginBottom: "10px" }}>Today</div>
        <h1 style={LEAD}>Nothing is due</h1>
        <p style={{ ...BODY, opacity: 0.6, margin: "10px 0 0" }}>
          Add a document and its amount, date and consequence appear here.
        </p>
      </section>
    );
  }

  const alsoLate = otherLateReturns(rows, now, action.row.id);
  const next = nextReturn(rows, now);

  return (
    <section aria-labelledby="first-action" style={{ marginBottom: "calc(var(--space-8) * 1.6)" }}>
      <Blueprint style={{ padding: "var(--space-8) var(--space-6)" }}>
        <div className="flex items-center" style={{ gap: "8px", marginBottom: "var(--space-4)" }}>
          <span style={{ ...KICKER, color: "var(--color-accent-700)", opacity: 1 }}>
            Do this first
          </span>
          <SpeakButton text={action.speech} label="Read this aloud" />
        </div>

        <div
          className="flex flex-wrap items-baseline justify-between"
          style={{ gap: "var(--space-4) var(--space-6)" }}
        >
          <div style={{ minWidth: "min(100%, 22ch)", flex: "1 1 24rem" }}>
            <h1 id="first-action" style={LEAD}>
              {action.title}
            </h1>
            {action.subtitle ? (
              <div style={{ ...NOTE, marginTop: "8px" }}>{action.subtitle}</div>
            ) : null}
          </div>

          {action.amount === null ? null : (
            <div style={{ flex: "0 1 21rem", textAlign: "left" }}>
              <div style={{ ...SECOND_FIGURE, color: "var(--stamp)" }}>
                {formatRupees(action.amount)}
              </div>
              <div style={{ ...NOTE, marginTop: "2px" }}>{action.amountNote}</div>
            </div>
          )}
        </div>

        <p style={{ ...BODY, margin: "var(--space-8) 0 0", maxWidth: "68ch" }}>
          <strong
            style={{
              fontWeight: 600,
              color: action.late ? "var(--stamp)" : undefined,
            }}
          >
            {action.count}.
          </strong>{" "}
          {action.because}
        </p>

        <div
          className="flex flex-wrap items-center"
          style={{ gap: "var(--space-4) var(--space-6)", marginTop: "var(--space-6)" }}
        >
          <Link href={`/doc/${encodeURIComponent(action.row.id)}`} className="btn btn-primary">
            {action.cta}
          </Link>

          <span style={ASIDE}>
            {alsoLate.length > 0 ? (
              <>
                Also late:{" "}
                {alsoLate.map((mention, index) => (
                  <span key={mention.row.id}>
                    {index > 0 ? " · " : ""}
                    <Mention mention={mention} />
                  </span>
                ))}
                . {alsoLate.length === 1 ? "It clears" : "They clear"} once this one is filed.{" "}
              </>
            ) : null}
            {next ? (
              <>
                Next: <Mention mention={next} />.
              </>
            ) : null}
          </span>
        </div>
      </Blueprint>
    </section>
  );
}
