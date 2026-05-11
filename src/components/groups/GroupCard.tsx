import Link from "next/link";
import { Group } from "@/types";
import { TeamBadge } from "@/components/teams/TeamBadge";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="block rounded-xl border border-card-border bg-card-bg p-4 shadow-sm transition-all hover:border-fifa-blue/30 hover:shadow-md active:scale-[0.98]"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fifa-blue font-display text-sm font-bold text-white">
          {group.id}
        </span>
        <span className="text-sm font-semibold text-fifa-dark-gray">
          Grupo {group.id}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {group.teams.map((teamId) => (
          <TeamBadge key={teamId} teamId={teamId} size="sm" />
        ))}
      </div>
    </Link>
  );
}
