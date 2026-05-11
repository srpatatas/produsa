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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-card-border bg-white/95 backdrop-blur-sm md:hidden">
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
                  ? "text-fifa-blue"
                  : "text-fifa-dark-gray hover:text-fifa-blue",
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
