import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { SiteFooter } from "@/components/SiteFooter";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

// Team1 global type: Kanit Medium 500 for headings, Kanit Light 300 for body.
// latin-ext carries ğ ş ı İ, which Turkish needs.
const kanit = Kanit({
  variable: "--nf-kanit",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "500"],
  display: "swap",
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
    "Team1 Türkiye üyeleri için doğum günü takvimi: bilgini ekle, yaklaşan doğum günlerini gör, kimseyi kutlamayı kaçırma.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

// Dark is the default; a saved choice is applied before first paint so the page never flashes.
const themeInit = `try{if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="dark" className={kanit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
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
