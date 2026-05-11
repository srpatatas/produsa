"use client";

import Link from "next/link";
import { Group, GroupId } from "@/types";
import { getTeam } from "@/data/teams";
import { getMatchesForGroup } from "@/data/matches";
import { FlagImage } from "@/components/teams/FlagImage";
import { usePredictions } from "@/context/PredictionsContext";

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
  const { predictions } = usePredictions();
  const matches = getMatchesForGroup(group.id);
  const predicted = matches.filter((m) => predictions[m.id]).length;
  const total = matches.length;
  const allDone = predicted === total;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-card-bg shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 active:scale-[0.98]"
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            allDone
              ? "bg-fifa-green/15 text-fifa-green"
              : predicted > 0
                ? "bg-fifa-blue/15 text-fifa-blue"
                : "bg-white/5 text-fifa-dark-gray"
          }`}>
            {allDone ? "✓ Completo" : `${predicted}/${total}`}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-fifa-dark-gray">
              Grupo
            </span>
            <span className="font-title text-3xl text-foreground">
              {group.id}
            </span>
          </div>
        </div>
        <div className="space-y-2.5">
          {group.teams.map((teamId) => {
            const team = getTeam(teamId);
            return (
              <div key={teamId} className="flex items-center gap-3">
                <FlagImage code={team.flagCode} name={team.name} size="sm" />
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
