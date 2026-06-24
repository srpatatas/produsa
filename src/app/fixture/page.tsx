"use client";

import { useState, useEffect } from "react";
import { groups } from "@/data/groups";
import { knockoutRounds } from "@/data/knockoutBracket";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { getTeam } from "@/data/teams";
import { resolveKnockoutMatch, setLiveResults } from "@/lib/knockoutResolver";
import { FlagImage } from "@/components/teams/FlagImage";
import { MatchResult } from "@/data/results";
import { FixtureGroupCard } from "@/components/fixture/FixtureGroupCard";
import { cn } from "@/lib/utils";
import { KnockoutRound } from "@/types";

const roundGradients: Record<KnockoutRound, string> = {
  R32: "from-fifa-teal to-cyan-500",
  R16: "from-fifa-blue to-indigo-600",
  QF: "from-fifa-purple to-fuchsia-600",
  SF: "from-fifa-red to-rose-600",
  "3P": "from-fifa-green to-lime-500",
  F: "from-fifa-gold to-amber-600",
};

export default function FixturePage() {
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const [phase, setPhase] = useState<"grupos" | "eliminatorias">("grupos");

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.ok ? r.json() : { results: {} })
      .then((data) => { setResults(data.results); setLiveResults(data.results); })
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {knockoutRounds.map((round) => {
            const matches = getKnockoutMatchesByRound(round.id);
            return (
              <div key={round.id} className="overflow-hidden rounded-2xl bg-card-bg shadow-sm shadow-black/20 ring-1 ring-white/5">
                <div className={`h-1.5 bg-gradient-to-r ${roundGradients[round.id] || "from-fifa-purple to-fifa-teal"}`} />
                <div className="p-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="font-display text-base tracking-wider text-fifa-dark-gray">
                      {round.label}
                    </span>
                    <span className="text-[10px] text-fifa-dark-gray/50">
                      {matches.length} partidos
                    </span>
                  </div>
                <div className="space-y-0">
                  {matches.map((km) => {
                    const resolved = resolveKnockoutMatch(km);
                    const home = resolved.homeTeamId ? getTeam(resolved.homeTeamId) : null;
                    const away = resolved.awayTeamId ? getTeam(resolved.awayTeamId) : null;
                    const result = results[km.id];

                    return (
                      <div
                        key={km.id}
                        className="text-xs"
                      >
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                            {home ? (
                              <>
                                <span className="font-display tracking-wider text-foreground truncate">{home.shortName}</span>
                                <FlagImage code={home.flagCode} name={home.name} size="sm" />
                              </>
                            ) : (
                              <span className="text-fifa-dark-gray/50 truncate">{km.homeSlot.label}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 px-1">
                            <span className={cn(
                              "font-display text-sm w-5 text-center",
                              result ? "text-foreground" : "text-fifa-dark-gray/30",
                            )}>
                              {result ? result.homeScore : "–"}
                            </span>
                            <span className="text-fifa-dark-gray/30">:</span>
                            <span className={cn(
                              "font-display text-sm w-5 text-center",
                              result ? "text-foreground" : "text-fifa-dark-gray/30",
                            )}>
                              {result ? result.awayScore : "–"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {away ? (
                              <>
                                <FlagImage code={away.flagCode} name={away.name} size="sm" />
                                <span className="font-display tracking-wider text-foreground truncate">{away.shortName}</span>
                              </>
                            ) : (
                              <span className="text-fifa-dark-gray/50 truncate">{km.awaySlot.label}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-center text-[9px] text-fifa-dark-gray pb-0.5">
                          {new Date(km.kickoff).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires" })} · {new Date(km.kickoff).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" })}h
                        </p>
                      </div>
                    );
                  })}
                </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
