"use client";

import { useState, useCallback, useRef } from "react";
import { groups } from "@/data/groups";
import { matches } from "@/data/matches";
import { getTeam } from "@/data/teams";
import { PlanillaTabs } from "./PlanillaTabs";
import { GroupPairCard } from "./GroupPairCard";
import { BonusPredictions } from "./BonusPredictions";
import { ComodinDock } from "./ComodinDock";
import { Toast } from "./Toast";
import { KnockoutPlanillaView } from "./KnockoutPlanillaView";
import { SaveIndicator } from "./SaveIndicator";
import { usePlanilla } from "@/context/PlanillaContext";
import { cn } from "@/lib/utils";

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
  const [phase, setPhase] = useState<"grupos" | "eliminatorias">("grupos");
  const [fecha, setFecha] = useState<1 | 2 | 3>(1);
  const { predictions, setPrediction } = usePlanilla();
  const [comodinByFecha, setComodinByFecha] = useState<Record<number, string | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const dropSucceeded = useRef(false);

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
    dropSucceeded.current = true;
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
      handleComodinRemove();
      setPlacementMode(true);
    } else {
      setPlacementMode((prev) => !prev);
    }
  }, [comodinMatchId, handleComodinRemove]);

  const handleComodinDragStart = useCallback(() => {
    dropSucceeded.current = false;
  }, []);

  const handleComodinDragEnd = useCallback(() => {
    if (!dropSucceeded.current) handleComodinRemove();
  }, [handleComodinRemove]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Planillas
          </h1>
          <p className="mt-1 text-base text-fifa-dark-gray">
            {phase === "grupos"
              ? "Completá tu planilla para cada fecha · 1 doble por fecha"
              : "Predecí los partidos de eliminatorias"}
          </p>
        </div>
        <div className="relative flex-shrink-0 flex h-10 w-[190px] items-center rounded-full bg-surface ring-1 ring-white/5">
          <div className={cn(
            "absolute h-9 w-[92px] rounded-full bg-fifa-purple shadow-lg shadow-fifa-purple/30 transition-all duration-300",
            phase === "grupos" ? "left-0.5" : "left-[96px]",
          )} />
          <button
            onClick={() => { setPhase("grupos"); setPlacementMode(false); }}
            className={cn(
              "relative z-10 flex-1 h-full flex items-center justify-center rounded-full font-display text-base uppercase tracking-wider transition-all duration-200 cursor-pointer",
              phase === "grupos"
                ? "text-white"
                : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-purple/10",
            )}
          >
            Grupos
          </button>
          <button
            onClick={() => { setPhase("eliminatorias"); setPlacementMode(false); }}
            className={cn(
              "relative z-10 flex-1 h-full flex items-center justify-center rounded-full font-display text-base uppercase tracking-wider transition-all duration-200 cursor-pointer",
              phase === "eliminatorias"
                ? "text-white"
                : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-purple/10",
            )}
          >
            Elimin.
          </button>
        </div>
      </div>

      {phase === "grupos" ? (
        <>
          <PlanillaTabs active={fecha} onChange={(f) => { setFecha(f); setPlacementMode(false); }} />

          <div className="space-y-6">
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
                onComodinDragStart={handleComodinDragStart}
                onComodinDragEnd={handleComodinDragEnd}
                onDoubleAttemptOnComodin={handleDoubleAttemptOnComodin}
              />
            ))}
          </div>

          <ComodinDock
            isPlaced={comodinMatchId !== null}
            isPlacementMode={placementMode}
            onTogglePlacementMode={handleTogglePlacementMode}
          />

          <BonusPredictions />
        </>
      ) : (
        <KnockoutPlanillaView />
      )}

      <SaveIndicator />
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
