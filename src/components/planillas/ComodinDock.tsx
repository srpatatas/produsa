"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ComodinDockProps {
  isPlaced: boolean;
}

export function ComodinDock({ isPlaced }: ComodinDockProps) {
  return (
    <div className="hidden md:flex items-center gap-3 rounded-2xl bg-card-bg p-3 ring-1 ring-white/5 shadow-sm shadow-black/20">
      <div
        draggable={!isPlaced}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", "comodin");
          e.dataTransfer.effectAllowed = "move";
        }}
        className={cn(
          "relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden ring-2 transition-all",
          isPlaced
            ? "opacity-30 ring-white/10 cursor-default"
            : "ring-fifa-gold cursor-grab active:cursor-grabbing hover:scale-110 hover:ring-fifa-gold/80 hover:shadow-lg hover:shadow-fifa-gold/20",
        )}
      >
        <Image
          src="/images/comodino.JPG"
          alt="Comodín"
          fill
          className="object-cover pointer-events-none"
        />
      </div>
      <div className="min-w-0">
        <span className="font-display text-xs tracking-wider text-fifa-gold">
          COMODÍN
        </span>
        <p className="text-[10px] text-fifa-dark-gray">
          {isPlaced
            ? "Colocado — arrastrá para mover"
            : "Arrastrá a un partido para +2 pts"}
        </p>
      </div>
    </div>
  );
}
