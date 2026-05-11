import Link from "next/link";
import { Group, GroupId } from "@/types";
import { getTeam } from "@/data/teams";
import { getFlagEmoji } from "@/data/flags";

interface GroupCardProps {
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

export function GroupCard({ group }: GroupCardProps) {
  const gradient = groupAccents[group.id];

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/5 ring-1 ring-black/[0.03] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 active:scale-[0.98]"
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl tracking-wider text-foreground">
              {group.id}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-fifa-dark-gray">
              Grupo
            </span>
          </div>
          <span className="text-lg">⚽</span>
        </div>
        <div className="space-y-2.5">
          {group.teams.map((teamId) => {
            const team = getTeam(teamId);
            return (
              <div key={teamId} className="flex items-center gap-3">
                <span className="text-xl">{getFlagEmoji(team.flagCode)}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-sm tracking-wider text-foreground">
                    {team.shortName}
                  </span>
                  <span className="text-xs text-fifa-dark-gray">{team.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
