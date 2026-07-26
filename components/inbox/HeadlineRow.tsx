import type { DocumentRow } from "@/components/lib/documents";
import { computeExposure, mostUrgent, overdueReceivables } from "@/components/lib/exposure";
import { deadlinePhrase } from "@/components/lib/copy";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { Blueprint } from "./Blueprint";
import { actionTitle } from "./rows";
import { daysInWords, documentsInWords, numberInWords, rupeesInWords } from "./speech";
import { CELL, FIGURE, NOTE } from "./styles";

interface CellProps {
  kicker: string;
  figure: string;
  support: string;
  speech: string;
  speechLabel: string;
  accent?: boolean;
}

function HeadlineCell({ kicker, figure, support, speech, speechLabel, accent }: CellProps) {
  return (
    <Blueprint className="card" style={CELL}>
      <div className="flex items-start justify-between gap-2">
        <div className="card-kicker" style={{ letterSpacing: "0.14em" }}>
          {kicker}
        </div>
        <SpeakButton text={speech} label={speechLabel} />
      </div>
      <div style={{ ...FIGURE, color: accent ? "var(--color-accent-700)" : undefined }}>
        {figure}
      </div>
      <div style={NOTE}>{support}</div>
    </Blueprint>
  );
}

interface HeadlineRowProps {
  rows: readonly DocumentRow[];
  now: Date;
}

export function HeadlineRow({ rows, now }: HeadlineRowProps) {
  const exposure = computeExposure(rows, now);
  const receivables = overdueReceivables(rows, now);
  const urgent = mostUrgent(rows, now);

  const obligationWord = exposure.documentCount === 1 ? "obligation" : "obligations";
  const buyerWord = receivables.count === 1 ? "buyer" : "buyers";

  const urgentAmount =
    urgent && hasAmount(urgent.row.amount) ? formatRupees(urgent.row.amount) : null;
  const urgentSupport = urgent
    ? [actionTitle(urgent.row), urgentAmount].filter(Boolean).join(" · ")
    : "Nothing is outstanding";

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--space-4)",
        marginBottom: "var(--space-8)",
      }}
    >
      <HeadlineCell
        kicker="Due in the next 30 days"
        figure={formatRupees(exposure.movingWithin30)}
        support={`${exposure.documentCount} ${obligationWord} · money going out`}
        speech={`${rupeesInWords(exposure.movingWithin30)} is due in the next thirty days, across ${documentsInWords(exposure.documentCount)}.`}
        speechLabel="Read what is due in the next 30 days"
      />

      <HeadlineCell
        accent
        kicker="Owed to you, over 45 days"
        figure={formatRupees(receivables.amount)}
        support={`${receivables.count} ${buyerWord} · you can claim under MSMED section 15`}
        speech={`${rupeesInWords(receivables.amount)} is owed to you and is more than forty five days late, from ${numberInWords(receivables.count)} ${buyerWord}.`}
        speechLabel="Read what is owed to you"
      />

      <HeadlineCell
        kicker="Most urgent"
        figure={urgent ? deadlinePhrase(urgent.days) : "Nothing due"}
        support={urgentSupport}
        speech={
          urgent
            ? `Most urgent: ${actionTitle(urgent.row).toLowerCase()}, ${daysInWords(urgent.days)}${urgentAmount ? `, ${rupeesInWords(urgent.row.amount ?? 0)}` : ""}.`
            : "Nothing is outstanding right now."
        }
        speechLabel="Read the most urgent obligation"
      />
    </div>
  );
}
