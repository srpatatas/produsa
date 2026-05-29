"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  onTouchDrop?: (matchId: string) => void;
  image?: string;
  customPhrases?: string[];
}

const defaultPhrases = [
  "Pssst... ¿querés 2 puntitos extra?",
  "Eh, vos... sí, vos. Tengo algo para vos.",
  "Dale, arrastrame a un partido.",
  "No seas amarrete, usame.",
  "2 puntos gratis. De nada.",
];

export function ComodinDock({ isPlaced, isPlacementMode, rejectMessage, suppressBubble, onTogglePlacementMode, onDragStart: onDockDragStart, onDragEnd: onDockDragEnd, onTouchDrop, image = "/images/comodino.JPG", customPhrases }: ComodinDockProps) {
  const phrases = customPhrases && customPhrases.length > 0 ? customPhrases : defaultPhrases;
  const [showBubble, setShowBubble] = useState(false);
  const [phrase, setPhrase] = useState(phrases[0]);
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  const touchStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const ghostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPhrase(phrases[0]);
  }, [phrases]);

  const showRandomPhrase = useCallback(() => {
    setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 4000);
  }, [phrases]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    usedTouch.current = true;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    hasMoved.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;

    if (!hasMoved.current && Math.abs(dx) + Math.abs(dy) > 10) {
      hasMoved.current = true;
      setTouchDragging(true);
      onDockDragStart?.();
    }

    if (hasMoved.current) {
      e.preventDefault();
      setTouchPos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = () => {
    if (!hasMoved.current) {
      onTogglePlacementMode();
      return;
    }

    setTouchDragging(false);

    const el = document.elementFromPoint(touchPos.x, touchPos.y);
    const matchRow = el?.closest("[data-match-id]");
    if (matchRow && onTouchDrop) {
      const matchId = matchRow.getAttribute("data-match-id");
      if (matchId) {
        onTouchDrop(matchId);
        return;
      }
    }

    onDockDragEnd?.();
  };

  const didDrag = useRef(false);
  const usedTouch = useRef(false);

  if (isPlaced) return null;

  return (
    <>
      <div className="sticky bottom-24 md:bottom-4 z-[80] flex justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => { if (usedTouch.current) { usedTouch.current = false; return; } if (!didDrag.current) onTogglePlacementMode(); didDrag.current = false; }}
            draggable
            onDragStart={(e) => {
              didDrag.current = true;
              e.dataTransfer.setData("text/plain", "comodin");
              e.dataTransfer.effectAllowed = "move";
              onDockDragStart?.();
            }}
            onDragEnd={() => {
              onDockDragEnd?.();
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all touch-none",
              touchDragging && "opacity-30",
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

      {touchDragging && (
        <div
          ref={ghostRef}
          className="fixed z-[100] h-14 w-14 rounded-full overflow-hidden ring-2 ring-fifa-gold shadow-2xl shadow-fifa-gold/40 pointer-events-none"
          style={{
            left: touchPos.x - 28,
            top: touchPos.y - 28,
          }}
        >
          <Image src={image} alt="Comodín" fill className="object-cover" />
        </div>
      )}
    </>
  );
}
