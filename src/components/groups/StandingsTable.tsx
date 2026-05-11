"use client";

import { Match } from "@/types";
import { getTeam } from "@/data/teams";
import { getFlagEmoji } from "@/data/flags";
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
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/5 ring-1 ring-black/[0.03]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 text-[11px] font-semibold uppercase tracking-wider text-fifa-dark-gray">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Equipo</th>
            <th className="px-4 py-3 text-center">PJ</th>
            <th className="px-4 py-3 text-center">G</th>
            <th className="px-4 py-3 text-center">E</th>
            <th className="px-4 py-3 text-center">P</th>
            <th className="hidden px-4 py-3 text-center sm:table-cell">GF</th>
            <th className="hidden px-4 py-3 text-center sm:table-cell">GC</th>
            <th className="px-4 py-3 text-center">DG</th>
            <th className="px-4 py-3 text-center">Pts</th>
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
                className={`border-b border-black/5 last:border-0 transition-colors ${
                  hasAnyPrediction && qualifies
                    ? "bg-emerald-50/60"
                    : hasAnyPrediction && thirdPlace
                      ? "bg-blue-50/60"
                      : ""
                }`}
              >
                <td className="px-4 py-3 font-semibold text-fifa-dark-gray">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{getFlagEmoji(team.flagCode)}</span>
                    <span className="font-display tracking-wider">{team.shortName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-fifa-dark-gray">{row.played}</td>
                <td className="px-4 py-3 text-center text-fifa-dark-gray">{row.won}</td>
                <td className="px-4 py-3 text-center text-fifa-dark-gray">{row.drawn}</td>
                <td className="px-4 py-3 text-center text-fifa-dark-gray">{row.lost}</td>
                <td className="hidden px-4 py-3 text-center text-fifa-dark-gray sm:table-cell">
                  {row.goalsFor}
                </td>
                <td className="hidden px-4 py-3 text-center text-fifa-dark-gray sm:table-cell">
                  {row.goalsAgainst}
                </td>
                <td className="px-4 py-3 text-center text-fifa-dark-gray">
                  {row.goalDifference > 0
                    ? `+${row.goalDifference}`
                    : row.goalDifference}
                </td>
                <td className="px-4 py-3 text-center font-bold text-foreground">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasAnyPrediction && (
        <div className="flex gap-4 border-t border-black/5 px-4 py-2.5 text-[11px] text-fifa-dark-gray">
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
