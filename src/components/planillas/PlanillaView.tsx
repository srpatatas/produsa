"use client";

import { useState } from "react";
import { groups } from "@/data/groups";
import { matches } from "@/data/matches";
import { PlanillaTabs } from "./PlanillaTabs";
import { GroupPairCard } from "./GroupPairCard";
import { BonusPredictions } from "./BonusPredictions";
import { usePlanilla } from "@/context/PlanillaContext";

const groupPairs = [
  [groups[0], groups[1]],   // A + B
  [groups[2], groups[3]],   // C + D
  [groups[4], groups[5]],   // E + F
  [groups[6], groups[7]],   // G + H
  [groups[8], groups[9]],   // I + J
  [groups[10], groups[11]], // K + L
];

export function PlanillaView() {
  const [fecha, setFecha] = useState<1 | 2 | 3>(1);
  const { predictions } = usePlanilla();

  const allFechaMatchIds = matches
    .filter((m) => m.matchday === fecha)
    .map((m) => m.id);

  const doubleMatchId = allFechaMatchIds.find(
    (id) => predictions[id]?.outcome.length === 2,
  ) ?? null;

  return (
    <div className="space-y-6">
      <PlanillaTabs active={fecha} onChange={setFecha} />

      <div className="space-y-6">
        {groupPairs.map(([a, b]) => (
          <GroupPairCard
            key={`${a.id}-${b.id}`}
            groupA={a}
            groupB={b}
            matchday={fecha}
            doubleMatchId={doubleMatchId}
          />
        ))}
      </div>

      <BonusPredictions />
    </div>
  );
}
