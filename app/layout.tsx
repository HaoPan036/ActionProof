import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolicyGate",
  description: "Deterministic runtime permission gateway for AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
