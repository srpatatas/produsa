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
    <div className="sticky bottom-24 md:bottom-4 z-[80] flex justify-end pointer-events-none">
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={onTogglePlacementMode}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "comodin");
            e.dataTransfer.effectAllowed = "move";
          }}
          className={cn(
            "group relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all",
            isPlacementMode
              ? "ring-2 ring-fifa-gold animate-pulse shadow-fifa-gold/30 scale-110"
              : "ring-2 ring-fifa-gold shadow-fifa-gold/20 hover:scale-110 hover:shadow-fifa-gold/40 active:scale-95 cursor-grab active:cursor-grabbing",
          )}
        >
          <Image
            src="/images/comodino.JPG"
            alt="Comodín"
            fill
            className="rounded-full object-cover pointer-events-none"
          />
        </button>

        <div className={cn(
          "absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-medium shadow-lg transition-all",
          isPlacementMode
            ? "bg-fifa-gold text-black"
            : "bg-card-bg text-fifa-dark-gray ring-1 ring-white/10 opacity-0 group-hover:opacity-100",
        )}>
          {isPlacementMode
            ? "Tocá un partido · +2 pts"
            : "Comodín · +2 pts"}
        </div>
      </div>
    </div>
  );
}
