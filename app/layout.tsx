import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CRM 2G",
    template: "%s | CRM 2G",
  },
  description:
    "Plataforma de CRM para gestão de leads, campanhas e propostas — integrada ao Meta Ads e Claude AI.",
  keywords: [
    "CRM",
    "marketing digital",
    "gestão de leads",
    "Meta Ads",
    "campanhas",
    "propostas",
    "relatórios",
  ],
  authors: [{ name: "CRM 2G" }],
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico",  sizes: "any" },
      { url: "/icon.svg",     type: "image/svg+xml" },
    ],
    apple: "/apple-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${dmSans.variable} dark`}>
      <body className="font-body antialiased bg-bg text-text min-h-screen">
        {children}
      </body>
    </html>
  );
}
