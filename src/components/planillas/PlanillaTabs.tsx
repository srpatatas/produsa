"use client";

import { cn } from "@/lib/utils";

interface PlanillaTabsProps {
  active: 1 | 2 | 3;
  onChange: (fecha: 1 | 2 | 3) => void;
  locks?: Record<string, { locksAt: string; isLocked: boolean }>;
}

const fechas: { id: 1 | 2 | 3; label: string }[] = [
  { id: 1, label: "Fecha 1" },
  { id: 2, label: "Fecha 2" },
  { id: 3, label: "Fecha 3" },
];

export function PlanillaTabs({ active, onChange, locks = {} }: PlanillaTabsProps) {
  return (
    <div className="flex rounded-full bg-surface p-1 ring-1 ring-white/5">
      {fechas.map((f) => {
        const isLocked = locks[`fecha-${f.id}`]?.isLocked ?? false;

        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 font-display text-base uppercase tracking-wider transition-all",
              active === f.id
                ? isLocked
                  ? "bg-fifa-dark-gray/50 text-white/70"
                  : "bg-fifa-teal text-white shadow-lg shadow-fifa-teal/20"
                : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-teal/10 cursor-pointer",
            )}
          >
            {isLocked && <span className="text-sm">🔒</span>}
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
