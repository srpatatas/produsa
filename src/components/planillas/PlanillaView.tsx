"use client";

import { useState } from "react";
import { groups } from "@/data/groups";
import { PlanillaTabs } from "./PlanillaTabs";
import { GroupPairCard } from "./GroupPairCard";
import { BonusPredictions } from "./BonusPredictions";

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
          />
        ))}
      </div>

      <BonusPredictions />
    </div>
  );
}
