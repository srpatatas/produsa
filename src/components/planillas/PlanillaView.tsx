"use client";

import { useState } from "react";
import { groups } from "@/data/groups";
import { matches } from "@/data/matches";
import { PlanillaTabs } from "./PlanillaTabs";
import { GroupPairCard } from "./GroupPairCard";
import { BonusPredictions } from "./BonusPredictions";
import { ComodinDock } from "./ComodinDock";
import { usePlanilla } from "@/context/PlanillaContext";

const groupPairs = [
  [groups[0], groups[1]],
  [groups[2], groups[3]],
  [groups[4], groups[5]],
  [groups[6], groups[7]],
  [groups[8], groups[9]],
  [groups[10], groups[11]],
];

export function PlanillaView() {
  const [fecha, setFecha] = useState<1 | 2 | 3>(1);
  const { predictions } = usePlanilla();
  const [comodinByFecha, setComodinByFecha] = useState<Record<number, string | null>>({
    1: null,
    2: null,
    3: null,
  });

  const allFechaMatchIds = matches
    .filter((m) => m.matchday === fecha)
    .map((m) => m.id);

  const doubleMatchId = allFechaMatchIds.find(
    (id) => predictions[id]?.outcome.length === 2,
  ) ?? null;

  const comodinMatchId = comodinByFecha[fecha] ?? null;

  const handleComodinDrop = (matchId: string) => {
    setComodinByFecha((prev) => ({ ...prev, [fecha]: matchId }));
  };

  const handleComodinRemove = () => {
    setComodinByFecha((prev) => ({ ...prev, [fecha]: null }));
  };

  return (
    <div className="space-y-6">
      <PlanillaTabs active={fecha} onChange={setFecha} />

      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-6">
          {groupPairs.map(([a, b]) => (
            <GroupPairCard
              key={`${a.id}-${b.id}`}
              groupA={a}
              groupB={b}
              matchday={fecha}
              doubleMatchId={doubleMatchId}
              comodinMatchId={comodinMatchId}
              onComodinDrop={handleComodinDrop}
              onComodinRemove={handleComodinRemove}
            />
          ))}
        </div>

        <div className="sticky top-20 hidden md:block">
          <ComodinDock isPlaced={comodinMatchId !== null} />
        </div>
      </div>

      <BonusPredictions />
    </div>
  );
}
