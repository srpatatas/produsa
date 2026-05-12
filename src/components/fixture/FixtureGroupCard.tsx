import Link from "next/link";
import { Group, GroupId } from "@/types";
import { getTeam } from "@/data/teams";
import { getMatchesForGroup } from "@/data/matches";
import { getMatchResult } from "@/data/results";
import { FlagImage } from "@/components/teams/FlagImage";
import { matchResults } from "@/data/results";
import { computeStandings } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface FixtureGroupCardProps {
  group: Group;
}

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

export function FixtureGroupCard({ group }: FixtureGroupCardProps) {
  const gradient = groupAccents[group.id];
  const groupMatches = getMatchesForGroup(group.id);
  const standings = computeStandings([...group.teams], groupMatches, matchResults);
  const hasResults = groupMatches.some((m) => matchResults[m.id]);

  return (
    <div className="overflow-hidden rounded-2xl bg-card-bg shadow-sm shadow-black/20 ring-1 ring-white/5">
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-display text-xs tracking-wider text-fifa-dark-gray">
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
            const result = getMatchResult(match.id);

            return (
              <div
                key={match.id}
                className="flex items-center gap-1.5 text-xs"
              >
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
            );
          })}
        </div>
      </div>

      <Link
        href={`/groups/${group.id}`}
        className="flex items-center justify-center border-t border-white/5 py-2.5 text-[10px] font-medium text-fifa-dark-gray transition-colors hover:text-fifa-teal hover:bg-white/[0.02]"
      >
        Ver detalle →
      </Link>
    </div>
  );
}
