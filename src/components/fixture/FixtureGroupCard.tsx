"use client";

import { memo, useMemo } from "react";
import { Group, GroupId } from "@/types";
import { getTeam } from "@/data/teams";
import { getMatchesForGroup } from "@/data/matches";
import { MatchResult } from "@/data/results";
import { FlagImage } from "@/components/teams/FlagImage";
import { computeStandings } from "@/lib/scoring";
import { getOutcome } from "@/lib/outcomeStyles";
import { usePlanilla } from "@/context/PlanillaContext";
import { cn } from "@/lib/utils";

interface FixtureGroupCardProps {
  group: Group;
  results: Record<string, MatchResult>;
}

export const FixtureGroupCard = memo(function FixtureGroupCard({ group, results }: FixtureGroupCardProps) {
  const gradient = groupAccents[group.id];
  const groupMatches = getMatchesForGroup(group.id);
  const standings = useMemo(() => computeStandings([...group.teams], groupMatches, results), [group.id, results]);
  const hasResults = groupMatches.some((m) => results[m.id]);
  const { predictions } = usePlanilla();

  return (
    <div className="overflow-hidden rounded-2xl bg-card-bg shadow-sm shadow-black/20 ring-1 ring-white/5">
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-display text-base tracking-wider text-fifa-dark-gray">
            GRUPO
          </span>
          <span className="font-title text-2xl text-foreground">
            {group.id}
          </span>
        </div>

        {/* Standings */}
        <div className="mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-fifa-dark-gray/60">
                <th className="pb-1 text-left">#</th>
                <th className="pb-1 text-left">Equipo</th>
                <th className="pb-1 text-center">PJ</th>
                <th className="pb-1 text-center">Pts</th>
                <th className="pb-1 text-center">DG</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => {
                const team = getTeam(row.teamId);
                return (
                  <tr
                    key={row.teamId}
                    className={cn(
                      "border-t border-white/5",
                      hasResults && i < 2 && "bg-emerald-500/10",
                      hasResults && i === 2 && "bg-blue-500/10",
                    )}
                  >
                    <td className="py-1.5 text-fifa-dark-gray">{i + 1}</td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-1.5">
                        <FlagImage code={team.flagCode} name={team.name} size="sm" />
                        <span className="font-display tracking-wider">{team.shortName}</span>
                      </div>
                    </td>
                    <td className="py-1.5 text-center text-fifa-dark-gray">{row.played}</td>
                    <td className="py-1.5 text-center font-semibold">{row.points}</td>
                    <td className="py-1.5 text-center text-fifa-dark-gray">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Match results */}
        <div className="space-y-1.5">
          {groupMatches.map((match) => {
            const home = getTeam(match.homeTeamId);
            const away = getTeam(match.awayTeamId);
            const result = results[match.id];
            const planillaPred = predictions[match.id];

            let predResult: "correct" | "wrong" | null = null;
            if (result && planillaPred) {
              const actual = getOutcome(result.homeScore, result.awayScore);
              predResult = planillaPred.outcome.includes(actual) ? "correct" : "wrong";
            }

            return (
              <div
                key={match.id}
                className="text-xs"
              >
                {result && (
                  <div className="text-center">
                    <span className={cn(
                      "text-[8px] font-semibold uppercase tracking-widest",
                      predResult === "correct" ? "text-fifa-green"
                        : predResult === "wrong" ? "text-fifa-red/70"
                        : "text-fifa-dark-gray/40",
                    )}>
                      {predResult === "correct" ? "Acertaste"
                        : predResult === "wrong" ? "Fallaste"
                        : "Sin predicción"}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-2 py-1">
                <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                  <span className="font-display tracking-wider text-foreground truncate">
                    {home.shortName}
                  </span>
                  <FlagImage code={home.flagCode} name={home.name} size="sm" />
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
                  <FlagImage code={away.flagCode} name={away.name} size="sm" />
                  <span className="font-display tracking-wider text-foreground truncate">
                    {away.shortName}
                  </span>
                </div>
                </div>
                <p className="text-center text-[8px] text-fifa-dark-gray/60 pb-0.5">
                  {new Date(match.kickoff).toLocaleDateString("es-AR", { day: "numeric", month: "short" })} · {new Date(match.kickoff).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}h
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const groupAccents: Record<GroupId, string> = {
  A: "from-fifa-green to-fifa-teal",
  B: "from-fifa-red to-rose-600",
  C: "from-fifa-blue to-indigo-600",
  D: "from-fifa-purple to-fuchsia-600",
  E: "from-amber-500 to-fifa-gold",
  F: "from-fifa-teal to-cyan-500",
  G: "from-fifa-red to-fifa-purple",
  H: "from-fifa-blue to-fifa-green",
  I: "from-fifa-purple to-fifa-blue",
  J: "from-fifa-green to-lime-500",
  K: "from-fifa-gold to-amber-600",
  L: "from-fifa-red to-fifa-blue",
};
