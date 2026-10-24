import type { Metadata } from "next";
import { Fraunces, Nunito, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const brand = Nunito({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loka — Student event fit",
  description:
    "Train and rank Boston student creative-event models with GMM tiers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${brand.variable} ${body.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
