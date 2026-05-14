"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const user = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full px-2 py-1 transition-all hover:bg-white/10"
      >
        <AvatarDisplay avatar={user.avatar} size="sm" />
        <span className="hidden text-sm font-medium text-white/80 sm:block">
          {user.name}
        </span>
        <svg
          className={cn("h-3 w-3 text-white/40 transition-transform", open && "rotate-180")}
          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl bg-card-bg shadow-xl shadow-black/30 ring-1 ring-white/10">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-[10px] text-fifa-dark-gray">{user.invite_code}</p>
          </div>
          <div className="py-1">
            {user.is_admin && (
              <button
                onClick={() => { setOpen(false); router.push("/admin"); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-fifa-purple transition-colors hover:bg-fifa-purple/5 hover:text-fifa-purple"
              >
                ⚙️ Admin
              </button>
            )}
            <button
              onClick={() => { setOpen(false); router.push("/cambiar-pin"); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-fifa-dark-gray transition-colors hover:bg-white/5 hover:text-foreground"
            >
              👤 Mi cuenta
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-fifa-red/70 transition-colors hover:bg-fifa-red/5 hover:text-fifa-red"
            >
              🚪 Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
