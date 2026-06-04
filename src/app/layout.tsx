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
  title: "Rocket Run — Synthwave Arcade",
  description:
    "Dodge neon obstacles and reach the planet in this synthwave arcade game built with React Three Fiber and Rapier physics.",
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
    title: "Rocket Run — Synthwave Arcade",
    description: "Dodge neon obstacles and reach the planet!",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Rocket Run — Synthwave Arcade",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rocket Run — Synthwave Arcade",
    description: "Dodge neon obstacles and reach the planet!",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#05060a] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
