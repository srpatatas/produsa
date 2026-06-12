"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/planillas", label: "Pronósticos", icon: "📋" },
  { href: "/ranking", label: "Posiciones", icon: "🏆" },
  { href: "/extras", label: "Extras", icon: "⭐" },
  { href: "/fixture", label: "Fixture", icon: "🏟️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md md:hidden">
      <div className="flex h-14 items-center justify-around rounded-2xl bg-[#161829]/90 shadow-lg shadow-black/20 ring-1 ring-white/10 backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 font-display text-[9px] uppercase tracking-wide transition-all",
                isActive
                  ? "text-fifa-blue"
                  : "text-white/30 hover:text-white/60",
              )}
            >
              <span className={cn("text-lg transition-transform", isActive && "scale-110")}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
