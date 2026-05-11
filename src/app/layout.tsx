import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Shell } from "@/components/layout/Shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Produsa — Predicciones Copa del Mundo 2026",
  description:
    "Predecí los resultados de la Copa del Mundo FIFA 2026 y competí con tus amigos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
