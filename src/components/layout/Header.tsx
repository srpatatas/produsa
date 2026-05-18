"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/fixture", label: "Fixture" },
  { href: "/planillas", label: "Planillas" },
  { href: "/ranking", label: "Ranking" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5">
      <div className="absolute inset-0 overflow-hidden sm:hidden">
        <Image
          src="/images/wc2026-banner.jpg"
          alt=""
          fill
          className="object-cover object-right opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-[#0c0e1a]/70 backdrop-blur-sm" />
      </div>
      <div className="hidden sm:block absolute inset-0 overflow-hidden">
        <Image
          src="/images/wc2026-banner.jpg"
          alt=""
          fill
          className="object-cover object-right opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-[#0c0e1a]/60 backdrop-blur-sm" />
      </div>
      <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/wc2026-logo.png"
            alt="FIFA World Cup 2026"
            width={32}
            height={32}
          />
          <span className="font-title text-lg text-foreground">
            PRODUSA
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 font-display text-base uppercase tracking-wider transition-all",
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

        <UserMenu />
      </div>
    </header>
  );
}
