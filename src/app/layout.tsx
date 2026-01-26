import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LEAF-Writer",
  description: "A web-based XML editor for TEI documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
