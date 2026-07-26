import Link from "next/link";
import { formatDateShort } from "@/components/lib/copy";
import { BUSINESS } from "@/components/lib/identity";
import { HEADING, KICKER } from "@/components/inbox/styles";
import { ResetButton } from "./ResetButton";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function today(now: Date): string {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return formatDateShort(ist.toISOString().slice(0, 10)) ?? "";
}


interface NavBarProps {
  now: Date;
}

export function NavBar({ now }: NavBarProps) {
  return (
    <header
      className="nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "10px var(--space-6)",
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      <Link
        href="/"
        style={{
          ...HEADING,
          fontSize: "21px",
          letterSpacing: "0.02em",
          color: "var(--color-text)",
          textDecoration: "none",
        }}
      >
        NAMMA MSME
      </Link>

      <span style={{ ...KICKER, opacity: 0.45 }}>Document obligation engine</span>

      <div style={{ flex: 1 }} />

      <span
        style={{
          fontSize: "11px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          opacity: 0.45,
        }}
      >
        {today(now)} · {BUSINESS.name}, {BUSINESS.place}
      </span>

      <ResetButton />
    </header>
  );
}
