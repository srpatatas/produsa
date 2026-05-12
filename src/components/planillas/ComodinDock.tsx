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
    <div className="sticky bottom-24 md:bottom-4 z-[80] flex justify-end">
      <div className="group relative">
        <button
          type="button"
          onClick={onTogglePlacementMode}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "comodin");
            e.dataTransfer.effectAllowed = "move";
          }}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all",
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
          "absolute bottom-full right-0 mb-3 rounded-xl px-3 py-2 text-[11px] font-medium shadow-lg transition-all pointer-events-none",
          "bg-fifa-gold text-black",
          isPlacementMode
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
        )}>
          <span className="italic">
            {isPlacementMode
              ? "Dale, elegí un partido..."
              : "Pssst... ¿querés 2 puntitos extra?"}
          </span>
          <div className="absolute -bottom-1 right-5 h-2 w-2 rotate-45 bg-fifa-gold" />
        </div>
      </div>
    </div>
  );
}
