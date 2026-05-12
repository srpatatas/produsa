"use client";

import { Group, GroupId } from "@/types";
import { getMatchesForGroup } from "@/data/matches";
import { PlanillaMatchRow } from "./PlanillaMatchRow";
import { usePlanilla } from "@/context/PlanillaContext";

interface GroupPairCardProps {
  groupA: Group;
  groupB: Group;
  matchday: 1 | 2 | 3;
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

function GroupSection({
  group,
  matchday,
  allMatchIds,
}: {
  group: Group;
  matchday: 1 | 2 | 3;
  allMatchIds: string[];
}) {
  const { getDoubleMatchId } = usePlanilla();
  const matches = getMatchesForGroup(group.id).filter((m) => m.matchday === matchday);
  const doubleId = getDoubleMatchId(matchday, allMatchIds);
  const gradient = groupAccents[group.id];

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${gradient}`} />
        <span className="font-display text-xs tracking-wider text-fifa-dark-gray">
          GRUPO {group.id}
        </span>
      </div>
      <div className="space-y-1.5">
        {matches.map((match) => (
          <PlanillaMatchRow
            key={match.id}
            match={match}
            hasDouble={doubleId !== null && doubleId !== match.id}
            onDoubleUsed={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

export function GroupPairCard({ groupA, groupB, matchday }: GroupPairCardProps) {
  const matchesA = getMatchesForGroup(groupA.id).filter((m) => m.matchday === matchday);
  const matchesB = getMatchesForGroup(groupB.id).filter((m) => m.matchday === matchday);
  const allMatchIds = [...matchesA, ...matchesB].map((m) => m.id);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <GroupSection group={groupA} matchday={matchday} allMatchIds={allMatchIds} />
      <GroupSection group={groupB} matchday={matchday} allMatchIds={allMatchIds} />
    </div>
  );
}
