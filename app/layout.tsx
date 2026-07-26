import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * No webfont. The UI face is the system sans and the data face is the system
 * mono (DESIGN.md, "Typography"): two functional families, nothing to
 * download, and no layout shift on a page whose figures must not move.
 */
export const metadata: Metadata = {
  title: "Gupta Hosiery Mills, case file",
  description:
    "Every notice, invoice and licence in one place. What it costs, when it is due, and what happens if it is ignored.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5f2",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
