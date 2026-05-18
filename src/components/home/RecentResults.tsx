"use client";

import { useState } from "react";
import { UnifiedMatch } from "@/types";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { MatchPredictionsDropdown } from "./MatchPredictionsDropdown";
import { getLiveOutcome } from "@/lib/outcomeStyles";

interface RecentResult extends UnifiedMatch {
  homeScore: number;
  awayScore: number;
}

interface RecentResultsProps {
  results: RecentResult[];
}

function RecentResultCard({ r }: { r: RecentResult }) {
  const [expanded, setExpanded] = useState(false);
  const home = r.homeTeamId ? getTeam(r.homeTeamId) : null;
  const away = r.awayTeamId ? getTeam(r.awayTeamId) : null;

  return (
    <div className="rounded-xl bg-surface/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3"
      >
        <div className="relative mb-2">
          <span className="block text-center text-[10px] font-semibold uppercase tracking-widest text-fifa-dark-gray">
            Final
          </span>
          <svg
            className={`absolute right-0 top-0 h-4 w-4 text-fifa-dark-gray/50 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
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
              <span className="text-sm text-fifa-dark-gray">{r.homeLabel}</span>
            )}
          </div>

          <div className="flex items-center gap-2 px-3">
            <span className="font-display text-2xl text-foreground">{r.homeScore}</span>
            <span className="text-sm text-fifa-dark-gray/40">-</span>
            <span className="font-display text-2xl text-foreground">{r.awayScore}</span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-1.5">
            {away ? (
              <>
                <FlagImage code={away.flagCode} name={away.name} size="lg" />
                <span className="font-display text-sm tracking-wider text-foreground">
                  {away.shortName}
                </span>
              </>
            ) : (
              <span className="text-sm text-fifa-dark-gray">{r.awayLabel}</span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <MatchPredictionsDropdown
          matchId={r.id}
          actualOutcome={getLiveOutcome(r.homeScore, r.awayScore)}
        />
      )}
    </div>
  );
}

export function RecentResults({ results }: RecentResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-card-bg shadow-sm shadow-black/20 ring-1 ring-white/5 overflow-hidden">
      <div className="bg-gradient-to-r from-fifa-purple/20 via-fifa-blue/20 to-fifa-teal/20 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-fifa-dark-gray">
          Resultados recientes
        </span>
      </div>
      <div className="space-y-1 p-3">
        {results.map((r) => (
          <RecentResultCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
