import Link from "next/link";
import { Group } from "@/types";
import { getTeam } from "@/data/teams";
import { getFlagEmoji } from "@/data/flags";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="group block rounded-2xl bg-white p-5 shadow-sm shadow-black/5 ring-1 ring-black/[0.03] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 active:scale-[0.98]"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-display text-2xl tracking-wider text-fifa-blue">
          GRUPO {group.id}
        </span>
        <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-semibold text-fifa-dark-gray transition-colors group-hover:bg-fifa-blue group-hover:text-white">
          6 partidos
        </span>
      </div>
      <div className="space-y-3">
        {group.teams.map((teamId) => {
          const team = getTeam(teamId);
          return (
            <div key={teamId} className="flex items-center gap-3">
              <span className="text-xl">{getFlagEmoji(team.flagCode)}</span>
              <span className="font-display text-sm tracking-wider text-foreground/80">
                {team.shortName}
              </span>
              <span className="text-sm text-fifa-dark-gray">{team.name}</span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
