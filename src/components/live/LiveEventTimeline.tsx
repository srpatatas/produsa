"use client";

import Image from "next/image";
import type { LiveEvent } from "@/types";

interface LiveEventTimelineProps {
  events: LiveEvent[];
  side: "home" | "away";
}

function formatMinute(e: LiveEvent): string {
  return e.extra ? `${e.minute}+${e.extra}'` : `${e.minute}'`;
}

function EventRow({ event, side }: { event: LiveEvent; side: "home" | "away" }) {
  const isGoal = event.type === "goal";
  const player = event.player && event.player !== "None" ? event.player : "";
  const detail = event.detail ? ` (${event.detail})` : "";

  const icon = isGoal ? (
    <Image
      src="/images/trionda.png"
      alt="gol"
      width={14}
      height={14}
      className="shrink-0"
    />
  ) : event.type === "red" ? (
    <span className="shrink-0 text-[10px] leading-none">🟥</span>
  ) : (
    <span className="shrink-0 text-[10px] leading-none">🟨</span>
  );

  return (
    <div className={`flex items-center gap-1 text-[11px] ${
      side === "home" ? "justify-end text-right" : "justify-start text-left"
    }`}>
      {side === "home" ? (
        <>
          <span className="truncate text-white/80">{player}{detail}</span>
          {icon}
          <span className="shrink-0 font-mono text-white/40">{formatMinute(event)}</span>
        </>
      ) : (
        <>
          <span className="shrink-0 font-mono text-white/40">{formatMinute(event)}</span>
          {icon}
          <span className="truncate text-white/80">{player}{detail}</span>
        </>
      )}
    </div>
  );
}

export function LiveEventTimeline({ events, side }: LiveEventTimelineProps) {
  const filtered = events.filter((e) => e.side === side);
  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort((a, b) => {
    const aMin = a.minute + (a.extra ?? 0) / 100;
    const bMin = b.minute + (b.extra ?? 0) / 100;
    return aMin - bMin;
  });

  return (
    <div className="flex flex-col gap-1">
      {sorted.map((e, i) => (
        <EventRow key={i} event={e} side={side} />
      ))}
    </div>
  );
}
