"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/en-vivo", label: "En Vivo" },
  { href: "/", label: "Grupos" },
  { href: "/ranking", label: "Ranking" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-fifa-blue shadow-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl tracking-wider text-white">
            PRODUSA
          </span>
          <span className="hidden text-xs font-medium text-white/60 sm:block">
            WE ARE 26
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-white"
                  : "text-white/60 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-lg">⚽</span>
          <span className="text-sm font-medium text-white/80">
            Player 1
          </span>
        </div>
      </div>
    </header>
  );
}
