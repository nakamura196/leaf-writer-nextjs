import "./globals.css";

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
      <body>
        <header className="bg-white">
          <nav
            className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
            aria-label="Global"
          >
            <div className="flex lg:flex-1">
              <a className="-m-1.5 p-1.5">LEAF Writer Next.js Demo</a>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
