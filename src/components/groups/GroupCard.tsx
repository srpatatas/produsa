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
      className="block overflow-hidden rounded-xl border border-card-border bg-card-bg shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="flex items-center gap-2 bg-fifa-blue px-4 py-2.5">
        <span className="font-display text-lg tracking-wider text-white">
          GRUPO {group.id}
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        {group.teams.map((teamId) => (
          <TeamBadge key={teamId} teamId={teamId} size="sm" />
        ))}
      </div>
    </Link>
  );
}
