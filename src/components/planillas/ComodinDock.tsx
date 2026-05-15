"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ComodinDockProps {
  isPlaced: boolean;
  isPlacementMode: boolean;
  rejectMessage?: string | null;
  suppressBubble?: boolean;
  onTogglePlacementMode: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  image?: string;
}

const phrases = [
  "Pssst... ¿querés 2 puntitos extra?",
  "Eh, vos... sí, vos. Tengo algo para vos.",
  "¿Estás seguro de ese resultado? Yo te puedo ayudar...",
  "Dale, arrastrame a un partido.",
  "No seas amarrete, usame.",
  "¿Qué mirás? Agarrame y poneme en un partido.",
  "2 puntos gratis. De nada.",
  "Soy tu amigo, confía en mí.",
];

export function ComodinDock({ isPlaced, isPlacementMode, rejectMessage, suppressBubble, onTogglePlacementMode, onDragStart: onDockDragStart, onDragEnd: onDockDragEnd, image = "/images/comodino.JPG" }: ComodinDockProps) {
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
            onDockDragStart?.();
          }}
          onDragEnd={() => {
            onDockDragEnd?.();
          }}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all",
            isPlacementMode
              ? "ring-2 ring-fifa-gold animate-pulse shadow-fifa-gold/30 scale-110"
              : "ring-2 ring-fifa-gold shadow-fifa-gold/20 hover:scale-110 hover:shadow-fifa-gold/40 active:scale-95 cursor-grab active:cursor-grabbing",
          )}
        >
          <Image
            src={image}
            alt="Comodín"
            fill
            className="rounded-full object-cover pointer-events-none"
          />
        </button>

        <div className={cn(
          "absolute bottom-full right-0 mb-3 w-52 rounded-xl px-3 py-2 text-[11px] font-medium shadow-lg transition-all duration-300 pointer-events-none",
          rejectMessage ? "bg-fifa-red text-white" : "bg-fifa-gold text-black",
          (rejectMessage || (!suppressBubble && (showBubble || isPlacementMode))) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
        )}>
          <span className="italic">
            {rejectMessage ?? (isPlacementMode ? "Dale, elegí un partido..." : phrase)}
          </span>
          <div className={cn("absolute -bottom-1 right-5 h-2 w-2 rotate-45", rejectMessage ? "bg-fifa-red" : "bg-fifa-gold")} />
        </div>
      </div>
    </div>
  );
}
