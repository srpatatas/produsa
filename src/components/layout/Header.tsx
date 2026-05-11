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
    <header className="sticky top-0 z-50 border-b border-card-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-fifa-blue">
            PRODUSA
          </span>
          <span className="hidden text-xs font-medium text-fifa-dark-gray sm:block">
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
                  ? "text-fifa-blue"
                  : "text-fifa-dark-gray hover:text-fifa-blue",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-lg">⚽</span>
          <span className="text-sm font-medium text-fifa-dark-gray">
            Player 1
          </span>
        </div>
      </div>
    </header>
  );
}
