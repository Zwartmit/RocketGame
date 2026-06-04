import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Super Rocket — Arcade Synthwave",
  description:
    "Esquiva obstáculos de neón y llega al planeta en este juego arcade synthwave construido con React Three Fiber y Rapier.",
  manifest: "/site.webmanifest",
  keywords: [
    "Arcade",
    "Synthwave",
    "Cyberpunk",
    "React Three Fiber",
    "Rapier",
    "3D Game",
    "Hackathon",
  ],
  authors: [{ name: "Brandon Urbano" }],
  openGraph: {
    title: "Super Rocket — Arcade Synthwave",
    description: "¡Esquiva obstáculos de neón y llega al planeta!",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Super Rocket — Arcade Synthwave",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Super Rocket — Arcade Synthwave",
    description: "¡Esquiva obstáculos de neón y llega al planeta!",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#05060a] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
