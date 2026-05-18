"use client";

import { useState } from "react";
import { UnifiedMatch } from "@/types";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { formatMatchTime } from "@/lib/utils";
import { MatchPredictionsDropdown } from "./MatchPredictionsDropdown";

interface TodayMatchCardProps {
  match: UnifiedMatch;
  isLocked: boolean;
}

export function TodayMatchCard({ match, isLocked }: TodayMatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const home = match.homeTeamId ? getTeam(match.homeTeamId) : null;
  const away = match.awayTeamId ? getTeam(match.awayTeamId) : null;

  return (
    <div className="rounded-xl bg-surface/50 overflow-hidden">
      <button
        type="button"
        onClick={() => isLocked && setExpanded((v) => !v)}
        className="w-full px-4 py-3"
      >
        <div className="relative mb-2">
          <span className="block text-center text-[10px] font-semibold uppercase tracking-widest text-fifa-dark-gray">
            {formatMatchTime(match.kickoff)}
          </span>
          {isLocked && (
            <svg
              className={`absolute right-0 top-0 h-4 w-4 text-fifa-dark-gray/50 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-1 flex-col items-center gap-1.5">
            {home ? (
              <>
                <FlagImage code={home.flagCode} name={home.name} size="lg" />
                <span className="font-display text-sm tracking-wider text-foreground">
                  {home.shortName}
                </span>
              </>
            ) : (
              <span className="text-sm text-fifa-dark-gray">{match.homeLabel}</span>
            )}
          </div>

          <span className="px-3 text-xs font-medium text-fifa-dark-gray">vs</span>

          <div className="flex flex-1 flex-col items-center gap-1.5">
            {away ? (
              <>
                <FlagImage code={away.flagCode} name={away.name} size="lg" />
                <span className="font-display text-sm tracking-wider text-foreground">
                  {away.shortName}
                </span>
              </>
            ) : (
              <span className="text-sm text-fifa-dark-gray">{match.awayLabel}</span>
            )}
          </div>
        </div>
      </button>

      {expanded && isLocked && <MatchPredictionsDropdown matchId={match.id} />}

      {!isLocked && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-[10px] text-fifa-dark-gray/50 text-center">
            Las predicciones se revelan al cerrar la fecha
          </p>
        </div>
      )}
    </div>
  );
}
