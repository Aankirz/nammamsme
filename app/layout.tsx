import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

/** Every trader-facing string is Devanagari, so this is the text face. */
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari", "latin"],
  display: "swap",
});

/** Second face, one job only: Latin stamps on the paper — GST, BILL, LIC. */
const stamp = Geist_Mono({
  variable: "--font-stamp",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "कागज़ — कितना, कब तक, किसने भेजा",
  description:
    "हर नोटिस, बिल और लाइसेंस एक जगह। रक़म, आख़िरी तारीख़ और न करने का नतीजा — साफ़ हिंदी में।",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f2ea",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="hi"
      className={`${devanagari.variable} ${stamp.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
