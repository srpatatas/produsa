"use client";

import { cn } from "@/lib/utils";

interface ViewToggleProps {
  active: "grupos" | "eliminatorias";
  onChange: (view: "grupos" | "eliminatorias") => void;
}

export function ViewToggle({ active, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-full bg-surface p-1 ring-1 ring-white/5">
      <button
        onClick={() => onChange("grupos")}
        className={cn(
          "flex-1 rounded-full px-4 py-2 font-display text-base uppercase tracking-wider transition-all",
          active === "grupos"
            ? "bg-fifa-purple text-white shadow-lg shadow-fifa-purple/20"
            : "text-fifa-dark-gray hover:text-foreground",
        )}
      >
        Grupos
      </button>
      <button
        onClick={() => onChange("eliminatorias")}
        className={cn(
          "flex-1 rounded-full px-4 py-2 font-display text-base uppercase tracking-wider transition-all",
          active === "eliminatorias"
            ? "bg-fifa-purple text-white shadow-lg shadow-fifa-purple/20"
            : "text-fifa-dark-gray hover:text-foreground",
        )}
      >
        Eliminatorias
      </button>
    </div>
  );
}
