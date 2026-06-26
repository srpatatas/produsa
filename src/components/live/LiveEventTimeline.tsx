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

function shortenName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

function EventRow({ event, side }: { event: LiveEvent; side: "home" | "away" }) {
  const isMissedPenalty = event.type === "goal" && event.detail === "Missed Penalty";
  const isGoal = event.type === "goal" && !isMissedPenalty;
  const player = event.player && event.player !== "None" ? shortenName(event.player) : "";
  const detail = event.detail ? ` (${event.detail})` : "";

  const icon = isMissedPenalty ? (
    <span className="shrink-0 text-[10px] leading-none">❌</span>
  ) : isGoal ? (
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
    <div className={`flex items-center gap-1 text-[11px] min-w-0 ${
      side === "home" ? "justify-end text-right" : "justify-start text-left"
    }`}>
      {side === "home" ? (
        <>
          <span className="min-w-0 flex-1 truncate text-white/80">{player}{detail}</span>
          {icon}
          <span className="shrink-0 font-mono text-white/40">{formatMinute(event)}</span>
        </>
      ) : (
        <>
          <span className="shrink-0 font-mono text-white/40">{formatMinute(event)}</span>
          {icon}
          <span className="min-w-0 flex-1 truncate text-white/80">{player}{detail}</span>
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
