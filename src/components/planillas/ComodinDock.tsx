"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ComodinDockProps {
  isPlaced: boolean;
  isPlacementMode: boolean;
  onTogglePlacementMode: () => void;
}

export function ComodinDock({ isPlaced, isPlacementMode, onTogglePlacementMode }: ComodinDockProps) {
  return (
    <div className="fixed bottom-28 right-4 z-[80] md:bottom-8 md:right-8">
      <button
        type="button"
        onClick={onTogglePlacementMode}
        draggable={!isPlaced}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", "comodin");
          e.dataTransfer.effectAllowed = "move";
        }}
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all",
          isPlacementMode
            ? "ring-2 ring-fifa-gold animate-pulse shadow-fifa-gold/30 scale-110"
            : isPlaced
              ? "ring-2 ring-white/10 opacity-40 shadow-black/20"
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
          ? "bg-fifa-gold text-black opacity-100"
          : "bg-card-bg text-fifa-dark-gray ring-1 ring-white/10 opacity-0 group-hover:opacity-100 pointer-events-none",
      )}>
        {isPlacementMode
          ? "Tocá un partido · +2 pts"
          : isPlaced
            ? "Colocado — tocá para mover"
            : "Comodín · +2 pts"}
      </div>
    </div>
  );
}
