import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwigPay — OpenClaw Agent Smart Wallets",
  description: "Penn Blockchain Conference Hackathon 2026 — Bounty 1 + Bounty 3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
