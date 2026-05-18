"use client";

import { UnifiedMatch } from "@/types";
import { TodayMatchCard } from "./TodayMatchCard";

interface TodayMatchesListProps {
  matches: UnifiedMatch[];
  locks: Record<string, { locksAt: string; isLocked: boolean }>;
}

export function TodayMatchesList({ matches, locks }: TodayMatchesListProps) {
  if (matches.length === 0) return null;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-card-bg shadow-sm shadow-black/20 ring-1 ring-white/5 overflow-hidden">
      <div className="bg-gradient-to-r from-fifa-purple/20 via-fifa-blue/20 to-fifa-teal/20 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          Hoy se juega
        </span>
      </div>
      <div className="space-y-1 p-3">
        {matches.map((m) => (
          <TodayMatchCard
            key={m.id}
            match={m}
            isLocked={locks[m.scope]?.isLocked ?? false}
          />
        ))}
      </div>
    </div>
  );
}
