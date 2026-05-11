"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/en-vivo", label: "En Vivo", icon: "📺" },
  { href: "/", label: "Grupos", icon: "🏟️" },
  { href: "/ranking", label: "Ranking", icon: "🏆" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-fifa-blue shadow-[0_-2px_10px_rgba(0,0,0,0.15)] md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/groups")
              : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "text-white/50 hover:text-white/80",
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
