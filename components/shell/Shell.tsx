import type { ReactNode } from "react";
import type { DocumentRow } from "@/components/lib/documents";
import { NavBar } from "./NavBar";

interface ShellProps {
  now: Date;
  rows?: readonly DocumentRow[];
  selectedId?: string;
  children: ReactNode;
}

export function Shell({ now, children }: ShellProps) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <NavBar now={now} />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
