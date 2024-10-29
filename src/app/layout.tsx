import "./globals.css";
import type { Metadata } from "next";

// either Static metadata
export const metadata: Metadata = {
  title: "LEAF Writer Next.js Demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script type="text/javascript" src="/leafwriter/index.min.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
