"use client";

import { Group, GroupId } from "@/types";
import { getMatchesForGroup } from "@/data/matches";
import { PlanillaMatchRow } from "./PlanillaMatchRow";

interface GroupPairCardProps {
  groupA: Group;
  groupB: Group;
  matchday: 1 | 2 | 3;
  doubleMatchId: string | null;
  comodinMatchId: string | null;
  placementMode: boolean;
  onComodinDrop: (matchId: string) => void;
  onComodinRemove: () => void;
  onComodinDragStart: () => void;
  onComodinDragEnd: () => void;
  onDoubleAttemptOnComodin: () => void;
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
  doubleMatchId,
  comodinMatchId,
  placementMode,
  onComodinDrop,
  onComodinRemove,
  onComodinDragStart,
  onComodinDragEnd,
  onDoubleAttemptOnComodin,
}: {
  group: Group;
  matchday: 1 | 2 | 3;
  doubleMatchId: string | null;
  comodinMatchId: string | null;
  placementMode: boolean;
  onComodinDrop: (matchId: string) => void;
  onComodinRemove: () => void;
  onComodinDragStart: () => void;
  onComodinDragEnd: () => void;
  onDoubleAttemptOnComodin: () => void;
}) {
  const matches = getMatchesForGroup(group.id).filter((m) => m.matchday === matchday);
  const gradient = groupAccents[group.id];

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${gradient}`} />
        <span className="font-display text-sm tracking-wider text-fifa-dark-gray">
          GRUPO {group.id}
        </span>
      </div>
      <div className="space-y-1.5">
        {matches.map((match) => (
          <PlanillaMatchRow
            key={match.id}
            match={match}
            doubleMatchId={doubleMatchId}
            comodinMatchId={comodinMatchId}
            placementMode={placementMode}
            onComodinDrop={onComodinDrop}
            onComodinRemove={onComodinRemove}
            onComodinDragStart={onComodinDragStart}
            onComodinDragEnd={onComodinDragEnd}
            onDoubleAttemptOnComodin={onDoubleAttemptOnComodin}
          />
        ))}
      </div>
    </div>
  );
}

export function GroupPairCard({
  groupA,
  groupB,
  matchday,
  doubleMatchId,
  comodinMatchId,
  placementMode,
  onComodinDrop,
  onComodinRemove,
  onComodinDragStart,
  onComodinDragEnd,
  onDoubleAttemptOnComodin,
}: GroupPairCardProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <GroupSection
        group={groupA}
        matchday={matchday}
        doubleMatchId={doubleMatchId}
        comodinMatchId={comodinMatchId}
        placementMode={placementMode}
        onComodinDrop={onComodinDrop}
        onComodinRemove={onComodinRemove}
        onComodinDragStart={onComodinDragStart}
        onComodinDragEnd={onComodinDragEnd}
        onDoubleAttemptOnComodin={onDoubleAttemptOnComodin}
      />
      <GroupSection
        group={groupB}
        matchday={matchday}
        doubleMatchId={doubleMatchId}
        comodinMatchId={comodinMatchId}
        placementMode={placementMode}
        onComodinDrop={onComodinDrop}
        onComodinRemove={onComodinRemove}
        onComodinDragStart={onComodinDragStart}
        onComodinDragEnd={onComodinDragEnd}
        onDoubleAttemptOnComodin={onDoubleAttemptOnComodin}
      />
    </div>
  );
}
