import type { Metadata } from "next";
import { Inter, Outfit, Baloo_2, Bebas_Neue, Oswald } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Shell } from "@/components/layout/Shell";
import { getSession } from "@/lib/auth";
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

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Produsa — Predicciones Copa del Mundo 2026",
  description:
    "Predecí los resultados de la Copa del Mundo FIFA 2026 y competí con tus amigos.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  const user = session
    ? {
        id: session.id,
        name: session.name,
        avatar: session.avatar,
        is_admin: session.is_admin,
        invite_code: session.invite_code,
      }
    : null;

  return (
    <html
      lang="es-AR"
      className={`${inter.variable} ${outfit.variable} ${baloo.variable} ${bebas.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers user={user}>
          {user ? <Shell>{children}</Shell> : children}
        </Providers>
      </body>
    </html>
  );
}
