"use client";

import { Match } from "@/types";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { usePredictions } from "@/context/PredictionsContext";
import { computeStandings } from "@/lib/scoring";

interface StandingsTableProps {
  teamIds: string[];
  matches: Match[];
}

export function StandingsTable({ teamIds, matches }: StandingsTableProps) {
  const { predictions } = usePredictions();
  const standings = computeStandings(teamIds, matches, predictions);
  const hasAnyPrediction = matches.some((m) => predictions[m.id]);

  return (
    <div className="overflow-x-auto rounded-2xl bg-card-bg shadow-sm shadow-black/20 ring-1 ring-white/5">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-[11px] font-semibold uppercase tracking-wider text-fifa-dark-gray">
            <th className="px-2 py-3 pl-4 sm:px-4">#</th>
            <th className="px-2 py-3 sm:px-4">Equipo</th>
            <th className="px-1.5 py-3 text-center sm:px-4">PJ</th>
            <th className="px-1.5 py-3 text-center sm:px-4">G</th>
            <th className="px-1.5 py-3 text-center sm:px-4">E</th>
            <th className="px-1.5 py-3 text-center sm:px-4">P</th>
            <th className="hidden px-4 py-3 text-center sm:table-cell">GF</th>
            <th className="hidden px-4 py-3 text-center sm:table-cell">GC</th>
            <th className="px-1.5 py-3 text-center sm:px-4">DG</th>
            <th className="px-1.5 py-3 pr-4 text-center sm:px-4">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const team = getTeam(row.teamId);
            const qualifies = i < 2;
            const thirdPlace = i === 2;

            return (
              <tr
                key={row.teamId}
                className={`border-b border-white/5 last:border-0 transition-colors duration-200 hover:bg-white/[0.03] ${
                  hasAnyPrediction && qualifies
                    ? "bg-emerald-500/10"
                    : hasAnyPrediction && thirdPlace
                      ? "bg-blue-500/10"
                      : ""
                }`}
              >
                <td className="px-2 py-3 pl-4 font-semibold text-fifa-dark-gray sm:px-4">{i + 1}</td>
                <td className="px-2 py-3 sm:px-4">
                  <div className="flex items-center gap-2">
                    <FlagImage code={team.flagCode} name={team.name} size="sm" />
                    <span className="font-display tracking-wider">{team.shortName}</span>
                  </div>
                </td>
                <td className="px-1.5 py-3 text-center text-fifa-dark-gray sm:px-4">{row.played}</td>
                <td className="px-1.5 py-3 text-center text-fifa-dark-gray sm:px-4">{row.won}</td>
                <td className="px-1.5 py-3 text-center text-fifa-dark-gray sm:px-4">{row.drawn}</td>
                <td className="px-1.5 py-3 text-center text-fifa-dark-gray sm:px-4">{row.lost}</td>
                <td className="hidden px-4 py-3 text-center text-fifa-dark-gray sm:table-cell">
                  {row.goalsFor}
                </td>
                <td className="hidden px-4 py-3 text-center text-fifa-dark-gray sm:table-cell">
                  {row.goalsAgainst}
                </td>
                <td className="px-1.5 py-3 text-center text-fifa-dark-gray sm:px-4">
                  {row.goalDifference > 0
                    ? `+${row.goalDifference}`
                    : row.goalDifference}
                </td>
                <td className="px-1.5 py-3 pr-4 text-center font-bold text-foreground sm:px-4">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasAnyPrediction && (
        <div className="flex gap-4 border-t border-white/5 px-4 py-2.5 text-[11px] text-fifa-dark-gray">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Clasifica
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
            Posible 3ro
          </span>
        </div>
      )}
    </div>
  );
}
