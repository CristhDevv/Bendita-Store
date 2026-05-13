import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Inter,
  Great_Vibes,
} from "next/font/google";
import "./globals.css";

/* ----------------------------------------
   Google Fonts — Bendita Store
---------------------------------------- */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

import { CONFIG } from "@/lib/config";

/* ----------------------------------------
   Metadata
---------------------------------------- */
export const metadata: Metadata = {
  metadataBase: new URL(CONFIG.SITE.URL),
  title: {
    default: "Bendita Store — Perfumería Premium",
    template: "%s | Bendita Store",
  },
  description:
    "Descubre fragancias exclusivas de las mejores marcas del mundo. Envío a toda Colombia.",
  keywords: ["perfumería", "fragancias", "perfumes", "Colombia", "premium"],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Bendita Store",
  },
};

/* ----------------------------------------
   Root Layout
---------------------------------------- */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${inter.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
