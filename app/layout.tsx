import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fairwork Pulse — Your work record",
  description: "Offline-first shift records, wage audits, incident evidence, and Haki Dossiers for Kenyan workers.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
