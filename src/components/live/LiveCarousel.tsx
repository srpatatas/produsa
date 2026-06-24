"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { UnifiedMatch, LiveScore } from "@/types";
import { LiveScoreboard } from "./LiveScoreboard";

export interface RankingSnapshotEntry {
  name: string;
  position: number;
  previousPosition: number;
  totalPoints: number;
}

interface LiveCarouselProps {
  matches: UnifiedMatch[];
  scores: Record<string, LiveScore>;
  staleIds: Set<string>;
  rankingSnapshot?: RankingSnapshotEntry[];
  onActiveIndexChange: (index: number) => void;
}

function ArrowButton({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 z-10 hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-sm ring-1 ring-white/10 transition-colors hover:bg-black/60 hover:text-white"
      style={{ [direction]: -16 }}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
}

export function LiveCarousel({
  matches,
  scores,
  staleIds,
  rankingSnapshot,
  onActiveIndexChange,
}: LiveCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleIndexChange = useCallback(
    (idx: number) => {
      setActiveIndex(idx);
      onActiveIndexChange(idx);
    },
    [onActiveIndexChange],
  );

  const scrollTo = useCallback((idx: number) => {
    containerRef.current
      ?.querySelectorAll("[data-carousel-card]")
      [idx]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || matches.length <= 1) return;

    const cards = container.querySelectorAll<HTMLElement>("[data-carousel-card]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) handleIndexChange(idx);
          }
        }
      },
      { root: container, threshold: 0.6 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [matches.length, handleIndexChange]);

  if (matches.length === 0) return null;

  if (matches.length === 1) {
    const m = matches[0];
    const score = scores[m.id] ?? { matchId: m.id, homeScore: -1, awayScore: -1, minute: 0 };
    return (
      <div className="mx-auto max-w-md">
        <LiveScoreboard match={m} liveScore={score} stale={staleIds.has(m.id)} rankingSnapshot={rankingSnapshot} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="relative">
        {activeIndex > 0 && (
          <ArrowButton direction="left" onClick={() => scrollTo(activeIndex - 1)} />
        )}
        {activeIndex < matches.length - 1 && (
          <ArrowButton direction="right" onClick={() => scrollTo(activeIndex + 1)} />
        )}

        <div
          ref={containerRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto"
        >
          {matches.map((m, i) => {
            const score = scores[m.id] ?? { matchId: m.id, homeScore: -1, awayScore: -1, minute: 0 };
            return (
              <div
                key={m.id}
                data-carousel-card
                data-index={i}
                className="w-full flex-shrink-0 snap-center"
              >
                <LiveScoreboard match={m} liveScore={score} stale={staleIds.has(m.id)} rankingSnapshot={rankingSnapshot} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {matches.map((m, i) => (
          <button
            key={m.id}
            type="button"
            aria-label={`Ir al partido ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === activeIndex
                ? "w-4 bg-fifa-blue"
                : "w-1.5 bg-fifa-dark-gray/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
