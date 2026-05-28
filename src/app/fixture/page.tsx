"use client";

import { useState, useEffect } from "react";
import { groups } from "@/data/groups";
import { knockoutRounds } from "@/data/knockoutBracket";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { getTeam } from "@/data/teams";
import { resolveKnockoutMatch } from "@/lib/knockoutResolver";
import { FlagImage } from "@/components/teams/FlagImage";
import { MatchResult } from "@/data/results";
import { FixtureGroupCard } from "@/components/fixture/FixtureGroupCard";
import { cn } from "@/lib/utils";

export default function FixturePage() {
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const [phase, setPhase] = useState<"grupos" | "eliminatorias">("grupos");

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.ok ? r.json() : { results: {} })
      .then((data) => setResults(data.results))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Fixture
        </h1>
        <p className="mt-1 text-xs text-fifa-dark-gray">
          Resultados y posiciones oficiales.
        </p>
      </div>

      <div className="relative flex h-10 w-[260px] ml-auto items-center rounded-full bg-surface ring-1 ring-white/5">
        <div className={cn(
          "absolute h-9 w-[127px] rounded-full bg-fifa-purple shadow-lg shadow-fifa-purple/30 transition-all duration-300",
          phase === "grupos" ? "left-0.5" : "left-[131px]",
        )} />
        <button
          onClick={() => setPhase("grupos")}
          className={cn(
            "relative z-10 flex-1 h-full flex items-center justify-center rounded-full font-display text-base uppercase tracking-wider transition-all duration-200 cursor-pointer",
            phase === "grupos"
              ? "text-white"
              : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-purple/10",
          )}
        >
          Grupos
        </button>
        <button
          onClick={() => setPhase("eliminatorias")}
          className={cn(
            "relative z-10 flex-1 h-full flex items-center justify-center rounded-full font-display text-base uppercase tracking-wider transition-all duration-200 cursor-pointer",
            phase === "eliminatorias"
              ? "text-white"
              : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-purple/10",
          )}
        >
          Eliminatorias
        </button>
      </div>

      {phase === "grupos" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <FixtureGroupCard key={group.id} group={group} results={results} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {knockoutRounds.map((round) => {
            const matches = getKnockoutMatchesByRound(round.id);
            return (
              <div key={round.id}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-1 w-6 rounded-full bg-gradient-to-r from-fifa-purple to-fifa-teal" />
                  <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                    {round.label}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {matches.map((km) => {
                    const resolved = resolveKnockoutMatch(km);
                    const home = resolved.homeTeamId ? getTeam(resolved.homeTeamId) : null;
                    const away = resolved.awayTeamId ? getTeam(resolved.awayTeamId) : null;
                    const result = results[km.id];

                    return (
                      <div
                        key={km.id}
                        className={cn(
                          "flex items-center gap-2 rounded-xl bg-card-bg px-3 py-2.5 ring-1 text-sm",
                          result ? "ring-fifa-teal/20" : "ring-white/5",
                        )}
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {home ? (
                            <>
                              <FlagImage code={home.flagCode} name={home.name} size="sm" />
                              <span className="font-display text-xs tracking-wider truncate">{home.shortName}</span>
                            </>
                          ) : (
                            <span className="text-xs text-fifa-dark-gray/50 truncate">{km.homeSlot.label}</span>
                          )}
                        </div>

                        {result ? (
                          <span className="font-display text-base text-foreground">
                            {result.homeScore} : {result.awayScore}
                          </span>
                        ) : (
                          <span className="text-xs text-fifa-dark-gray/30">vs</span>
                        )}

                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          {away ? (
                            <>
                              <span className="font-display text-xs tracking-wider truncate text-right">{away.shortName}</span>
                              <FlagImage code={away.flagCode} name={away.name} size="sm" />
                            </>
                          ) : (
                            <span className="text-xs text-fifa-dark-gray/50 truncate text-right">{km.awaySlot.label}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
