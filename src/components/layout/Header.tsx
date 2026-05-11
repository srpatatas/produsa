"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/en-vivo", label: "En Vivo" },
  { href: "/", label: "Pronósticos" },
  { href: "/ranking", label: "Ranking" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#0c0e1a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fifa-purple to-fifa-teal">
            <span className="font-display text-sm text-white tracking-wider">26</span>
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Produsa
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/" || pathname.startsWith("/groups")
                : pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:bg-white/10 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm">
            ⚽
          </div>
        </div>
      </div>
    </header>
  );
}
