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
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card-bg shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-card-border bg-surface text-xs font-semibold text-fifa-dark-gray">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Equipo</th>
            <th className="px-3 py-2 text-center">PJ</th>
            <th className="px-3 py-2 text-center">G</th>
            <th className="px-3 py-2 text-center">E</th>
            <th className="px-3 py-2 text-center">P</th>
            <th className="hidden px-3 py-2 text-center sm:table-cell">GF</th>
            <th className="hidden px-3 py-2 text-center sm:table-cell">GC</th>
            <th className="px-3 py-2 text-center">DG</th>
            <th className="px-3 py-2 text-center font-bold">Pts</th>
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
                className={`border-b border-card-border last:border-0 ${
                  hasAnyPrediction && qualifies
                    ? "bg-fifa-green-light"
                    : hasAnyPrediction && thirdPlace
                      ? "bg-fifa-blue-light"
                      : ""
                }`}
              >
                <td className="px-3 py-2 font-semibold">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span>{getFlagEmoji(team.flagCode)}</span>
                    <span className="font-display tracking-wide">{team.shortName}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center">{row.played}</td>
                <td className="px-3 py-2 text-center">{row.won}</td>
                <td className="px-3 py-2 text-center">{row.drawn}</td>
                <td className="px-3 py-2 text-center">{row.lost}</td>
                <td className="hidden px-3 py-2 text-center sm:table-cell">
                  {row.goalsFor}
                </td>
                <td className="hidden px-3 py-2 text-center sm:table-cell">
                  {row.goalsAgainst}
                </td>
                <td className="px-3 py-2 text-center">
                  {row.goalDifference > 0
                    ? `+${row.goalDifference}`
                    : row.goalDifference}
                </td>
                <td className="px-3 py-2 text-center font-bold">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasAnyPrediction && (
        <div className="flex gap-4 border-t border-card-border px-3 py-2 text-xs text-fifa-dark-gray">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-fifa-green" />
            Clasifica
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-fifa-blue" />
            Posible 3ro
          </span>
        </div>
      )}
    </div>
  );
}
