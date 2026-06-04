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
  metadataBase: new URL("https://leynewton.devmit-tech.com"),
  title: {
    default: "Laboratorio 3D: Segunda Ley de Newton",
    template: "%s | Laboratorio de Física",
  },
  description:
    "Simulador interactivo en 3D para comprobar la Segunda Ley de Newton (Dinámica). Modifica la fuerza y la masa en gravedad cero y observa la aceleración en tiempo real.",
  manifest: "/site.webmanifest",
  keywords: [
    "Física",
    "Segunda Ley de Newton",
    "Simulador 3D",
    "React Three Fiber",
    "Educación",
    "Dinámica",
    "Gravedad Cero",
  ],
  authors: [{ name: "Brandon Urbano" }],
  openGraph: {
    title: "Laboratorio 3D: Segunda Ley de Newton",
    description: "Experimento interactivo de cinemática y dinámica en 3D.",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Laboratorio 3D: Segunda Ley de Newton",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Laboratorio 3D: Segunda Ley de Newton",
    description: "Experimento interactivo de cinemática y dinámica en 3D.",
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
      <body className="min-h-full flex flex-col bg-black text-zinc-100">
        {children}
      </body>
    </html>
  );
}
