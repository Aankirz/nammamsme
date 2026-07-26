import type { ObligationRow } from "@/lib/types";
import { daysUntil } from "@/components/lib/dates";
import {
  deadlinePhrase,
  expiryPhrase,
  formatHindiDate,
  noAmountPhrase,
} from "@/components/lib/hindi";
import { formatRupees, hasAmount } from "@/components/lib/money";
import { chipForRow, STRIPE_CLASSES } from "@/components/lib/urgency";
import { Money } from "@/components/ui/Money";
import { FactCard } from "./FactCard";

interface FactCardsProps {
  row: ObligationRow;
  now: Date;
}

/** कितना · कब तक · किसने भेजा — the three facts, in that order. */
export function FactCards({ row, now }: FactCardsProps) {
  const left = daysUntil(row.deadline, now);
  const chip = chipForRow(row, now);
  const deadlineDate = formatHindiDate(row.deadline);
  const timing =
    row.doc_type === "licence" ? expiryPhrase(left) : deadlinePhrase(left);
  const isReceivable = row.direction === "owed";
  const priced = hasAmount(row.amount);

  return (
    <ul className="flex flex-col gap-3 px-4 pt-5">
      <FactCard
        question="कितना"
        speech={
          priced
            ? `रक़म ${formatRupees(row.amount)}`
            : noAmountPhrase(row.doc_type)
        }
        speechLabel="रक़म सुनें"
        accentClassName={isReceivable ? "bg-credit" : "bg-ink"}
        footnote={
          priced ? (isReceivable ? "आपको मिलना है" : "आपको देना है") : null
        }
      >
        {priced ? (
          <Money
            amount={row.amount}
            size="md"
            className={isReceivable ? "text-credit" : "text-ink"}
          />
        ) : (
          <p className="text-title font-bold text-ink-soft">
            {noAmountPhrase(row.doc_type)}
          </p>
        )}
      </FactCard>

      <FactCard
        question="कब तक"
        speech={`आख़िरी तारीख़ ${deadlineDate ?? "मालूम नहीं"}, ${timing}`}
        speechLabel="आख़िरी तारीख़ सुनें"
        accentClassName={STRIPE_CLASSES[chip.tone]}
        footnote={timing}
      >
        <p className="numerals text-money-sm font-bold text-ink">
          {deadlineDate ?? "तारीख़ नहीं मिली"}
        </p>
      </FactCard>

      <FactCard
        question="किसने भेजा"
        speech={`भेजने वाला ${row.counterparty}`}
        speechLabel="भेजने वाले का नाम सुनें"
        footnote={formatHindiDate(row.doc_date)}
      >
        <p className="text-title font-bold text-ink">{row.counterparty}</p>
      </FactCard>
    </ul>
  );
}
