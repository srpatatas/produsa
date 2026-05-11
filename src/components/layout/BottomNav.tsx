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
    <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md md:hidden">
      <div className="flex h-14 items-center justify-around rounded-2xl bg-white/80 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl">
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
                "flex flex-col items-center gap-0.5 rounded-xl px-5 py-1.5 text-[10px] font-semibold transition-all",
                isActive
                  ? "text-fifa-blue"
                  : "text-gray-400 hover:text-gray-600",
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
