import type { Metadata } from "next";
import { Big_Shoulders, Ubuntu_Sans } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const display = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const body = Ubuntu_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Team1 Türkiye — Doğum Günü Takvimi",
  description:
    "Avalanche Team1 Türkiye üyeleri için doğum günü takvimi: bilgini ekle, yaklaşan doğum günlerini gör, kimseyi kutlamayı kaçırma.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <div className="ambient-glow" aria-hidden="true" />
        <div className="grain-overlay" aria-hidden="true" />
        <NavBar />
        <main className="relative z-10 flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
