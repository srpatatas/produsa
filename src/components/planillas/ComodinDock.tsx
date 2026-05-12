"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ComodinDockProps {
  isPlaced: boolean;
  isPlacementMode: boolean;
  onTogglePlacementMode: () => void;
}

export function ComodinDock({ isPlaced, isPlacementMode, onTogglePlacementMode }: ComodinDockProps) {
  if (isPlaced) return null;

  return (
    <div className="flex justify-center py-4">
      <button
        type="button"
        onClick={onTogglePlacementMode}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", "comodin");
          e.dataTransfer.effectAllowed = "move";
        }}
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl bg-card-bg px-4 py-3 shadow-lg ring-1 transition-all",
          isPlacementMode
            ? "ring-fifa-gold shadow-fifa-gold/20 scale-105"
            : "ring-fifa-gold/50 shadow-black/20 hover:ring-fifa-gold hover:shadow-fifa-gold/20 hover:scale-105 cursor-grab active:cursor-grabbing",
        )}
      >
        <div className={cn(
          "relative h-10 w-10 flex-shrink-0 rounded-full overflow-hidden ring-2 transition-all",
          isPlacementMode ? "ring-fifa-gold animate-pulse" : "ring-fifa-gold/50",
        )}>
          <Image
            src="/images/comodino.JPG"
            alt="Comodín"
            fill
            className="object-cover pointer-events-none"
          />
        </div>
        <div className="text-left">
          <span className="font-display text-xs tracking-wider text-fifa-gold">
            COMODÍN
          </span>
          <p className="text-[10px] text-fifa-dark-gray">
            {isPlacementMode
              ? "Tocá un partido para colocar"
              : "Arrastrá o tocá · +2 pts"}
          </p>
        </div>
        {isPlacementMode && (
          <span className="rounded-full bg-fifa-gold px-2 py-0.5 text-[9px] font-bold text-black">
            ACTIVO
          </span>
        )}
      </button>
    </div>
  );
}
