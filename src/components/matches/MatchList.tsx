"use client";

import { Match } from "@/types";
import { MatchCard } from "./MatchCard";

interface MatchListProps {
  matches: Match[];
}

export function MatchList({ matches }: MatchListProps) {
  const byMatchday = [1, 2, 3].map((md) =>
    matches.filter((m) => m.matchday === md),
  );

  return (
    <div className="space-y-6">
      {byMatchday.map((dayMatches, i) => (
        <div key={i + 1}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fifa-dark-gray">
            Fecha {i + 1}
          </h3>
          <div className="space-y-3">
            {dayMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
