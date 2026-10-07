import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

// latin-ext carries ğ ş ı İ, which Turkish needs.
const sans = Geist({
  variable: "--nf-sans",
  subsets: ["latin", "latin-ext"],
});

const mono = Geist_Mono({
  variable: "--nf-mono",
  subsets: ["latin", "latin-ext"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Team1 Türkiye Doğum Günü Takvimi",
    template: "%s - Team1 Türkiye",
  },
  description:
    "Avalanche Team1 Türkiye üyeleri için doğum günü takvimi: bilgini ekle, yaklaşan doğum günlerini gör, kimseyi kutlamayı kaçırma.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${sans.variable} ${mono.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <a href="#icerik" className="skip">
          İçeriğe geç
        </a>
        <NavBar />
        <main id="icerik" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
