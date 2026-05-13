"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface KnockoutComodinDockProps {
  isPlaced: boolean;
  isPlacementMode: boolean;
  onTogglePlacementMode: () => void;
  image: string;
}

const phrases = [
  "¿Querés 2 puntitos extra?",
  "Dale, elegí un partido...",
  "Confiá en mí.",
  "Este partido lo tenés claro, ¿no?",
  "Poneme ahí que te doy suerte.",
];

export function KnockoutComodinDock({
  isPlaced,
  isPlacementMode,
  onTogglePlacementMode,
  image,
}: KnockoutComodinDockProps) {
  const [showBubble, setShowBubble] = useState(false);
  const [phrase, setPhrase] = useState(phrases[0]);

  const showRandomPhrase = useCallback(() => {
    setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 4000);
  }, []);

  useEffect(() => {
    if (isPlaced || isPlacementMode) return;

    let timeout: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = 10000 + Math.random() * 10000;
      timeout = setTimeout(() => {
        showRandomPhrase();
        scheduleNext();
      }, delay);
    };

    timeout = setTimeout(() => {
      showRandomPhrase();
      scheduleNext();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isPlaced, isPlacementMode, showRandomPhrase]);

  if (isPlaced) return null;

  return (
    <div className="sticky bottom-24 md:bottom-4 z-[80] flex justify-end">
      <div className="relative">
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
          <Image src={image} alt="Comodín" fill className="rounded-full object-cover pointer-events-none" />
        </button>

        <div className={cn(
          "absolute bottom-full right-0 mb-3 w-52 rounded-xl px-3 py-2 text-[11px] font-medium shadow-lg transition-all duration-300 pointer-events-none",
          "bg-fifa-gold text-black",
          (showBubble || isPlacementMode) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
        )}>
          <span className="italic">
            {isPlacementMode ? "Tocá un partido · +2 pts" : phrase}
          </span>
          <div className="absolute -bottom-1 right-5 h-2 w-2 rotate-45 bg-fifa-gold" />
        </div>
      </div>
    </div>
  );
}
