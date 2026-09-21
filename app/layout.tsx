import type { Metadata } from "next";
import "./globals.css";
import { OfflineRuntime } from "@/components/offline-runtime";

export const metadata: Metadata = {
  title: "Fairwork Pulse — Your work record",
  description: "Offline-first shift records, wage audits, incident evidence, and Haki Dossiers for Kenyan workers.",
  manifest: "/manifest.webmanifest",
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
      <body className="antialiased"><OfflineRuntime />{children}</body>
    </html>
  );
}
