"use client";

import { useState, useCallback } from "react";
import { groups } from "@/data/groups";
import { matches } from "@/data/matches";
import { getTeam } from "@/data/teams";
import { PlanillaTabs } from "./PlanillaTabs";
import { GroupPairCard } from "./GroupPairCard";
import { BonusPredictions } from "./BonusPredictions";
import { ComodinDock } from "./ComodinDock";
import { Toast } from "./Toast";
import { usePlanilla } from "@/context/PlanillaContext";

const groupPairs = [
  [groups[0], groups[1]],
  [groups[2], groups[3]],
  [groups[4], groups[5]],
  [groups[6], groups[7]],
  [groups[8], groups[9]],
  [groups[10], groups[11]],
];

function matchLabel(matchId: string): string {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return matchId;
  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  return `${home.shortName} vs ${away.shortName}`;
}

export function PlanillaView() {
  const [fecha, setFecha] = useState<1 | 2 | 3>(1);
  const { predictions, setPrediction } = usePlanilla();
  const [comodinByFecha, setComodinByFecha] = useState<Record<number, string | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState(false);

  const allFechaMatchIds = matches
    .filter((m) => m.matchday === fecha)
    .map((m) => m.id);

  const doubleMatchId = allFechaMatchIds.find(
    (id) => predictions[id]?.outcome.length === 2,
  ) ?? null;

  const comodinMatchId = comodinByFecha[fecha] ?? null;

  const handleComodinDrop = useCallback((matchId: string) => {
    const pred = predictions[matchId];
    if (pred && pred.outcome.length === 2) {
      const singleOutcome = pred.outcome[0] as "L" | "E" | "V";
      setPrediction(matchId, singleOutcome);
      setToast(`Se removió el DOBLE de ${matchLabel(matchId)}`);
    }
    setComodinByFecha((prev) => ({ ...prev, [fecha]: matchId }));
    setPlacementMode(false);
  }, [predictions, setPrediction, fecha]);

  const handleComodinRemove = useCallback(() => {
    setComodinByFecha((prev) => ({ ...prev, [fecha]: null }));
  }, [fecha]);

  const handleDoubleAttemptOnComodin = useCallback(() => {
    setComodinByFecha((prev) => ({ ...prev, [fecha]: null }));
    setToast("Se removió el COMODÍN — no se puede combinar con DOBLE");
  }, [fecha]);

  const handleTogglePlacementMode = useCallback(() => {
    if (comodinMatchId) {
      // Already placed — remove it
      handleComodinRemove();
      setPlacementMode(true);
    } else {
      setPlacementMode((prev) => !prev);
    }
  }, [comodinMatchId, handleComodinRemove]);

  return (
    <div className="space-y-6">
      <PlanillaTabs active={fecha} onChange={(f) => { setFecha(f); setPlacementMode(false); }} />

      <ComodinDock
        isPlaced={comodinMatchId !== null}
        isPlacementMode={placementMode}
        onTogglePlacementMode={handleTogglePlacementMode}
      />

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
              placementMode={placementMode}
              onComodinDrop={handleComodinDrop}
              onComodinRemove={handleComodinRemove}
              onDoubleAttemptOnComodin={handleDoubleAttemptOnComodin}
            />
          ))}
        </div>

        <div className="sticky top-20 hidden md:block">
          <ComodinDock
            isPlaced={comodinMatchId !== null}
            isPlacementMode={false}
            onTogglePlacementMode={() => {}}
          />
        </div>
      </div>

      <BonusPredictions />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
