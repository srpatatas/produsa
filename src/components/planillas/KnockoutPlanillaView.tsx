"use client";

import { useState, useCallback, useRef } from "react";
import { KnockoutRound } from "@/types";
import { knockoutRounds } from "@/data/knockoutBracket";
import { getKnockoutMatchesByRound, knockoutMatches } from "@/data/knockoutMatches";
import { getTeam } from "@/data/teams";
import { matches as groupMatches } from "@/data/matches";
import { KnockoutPlanillaMatchRow } from "./KnockoutPlanillaMatchRow";
import { ComodinDock } from "./ComodinDock";
import { Toast } from "./Toast";
import { usePlanilla } from "@/context/PlanillaContext";
import { cn } from "@/lib/utils";

function matchLabel(matchId: string): string {
  const gMatch = groupMatches.find((m) => m.id === matchId);
  if (gMatch) {
    return `${getTeam(gMatch.homeTeamId).shortName} vs ${getTeam(gMatch.awayTeamId).shortName}`;
  }
  return matchId;
}

export function KnockoutPlanillaView() {
  const [activeRound, setActiveRound] = useState<KnockoutRound>("R32");
  const { predictions, setPrediction } = usePlanilla();
  const [comodinByRound, setComodinByRound] = useState<Record<string, string | null>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const dropSucceeded = useRef(false);

  const roundMatches = getKnockoutMatchesByRound(activeRound);
  const roundMatchIds = roundMatches.map((m) => m.id);

  const doubleMatchId = roundMatchIds.find(
    (id) => predictions[id]?.outcome.length === 2,
  ) ?? null;

  const comodinMatchId = comodinByRound[activeRound] ?? null;

  const handleComodinDrop = useCallback((matchId: string) => {
    const pred = predictions[matchId];
    if (pred && pred.outcome.length === 2) {
      const singleOutcome = pred.outcome[0] as "L" | "E" | "V";
      setPrediction(matchId, singleOutcome);
      setToast(`Se removió el DOBLE de ${matchLabel(matchId)}`);
    }
    dropSucceeded.current = true;
    setComodinByRound((prev) => ({ ...prev, [activeRound]: matchId }));
    setPlacementMode(false);
  }, [predictions, setPrediction, activeRound]);

  const handleComodinRemove = useCallback(() => {
    setComodinByRound((prev) => ({ ...prev, [activeRound]: null }));
  }, [activeRound]);

  const handleDoubleAttemptOnComodin = useCallback(() => {
    setComodinByRound((prev) => ({ ...prev, [activeRound]: null }));
    setToast("Se removió el COMODÍN — no se puede combinar con DOBLE");
  }, [activeRound]);

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

  const roundInfo = knockoutRounds.find((r) => r.id === activeRound);

  return (
    <div className="space-y-4">
      {/* Round tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-card-bg p-1 ring-1 ring-white/5">
        {knockoutRounds.map((round) => {
          const rMatches = getKnockoutMatchesByRound(round.id);
          const predicted = rMatches.filter((m) => predictions[m.id]).length;
          const isActive = activeRound === round.id;

          return (
            <button
              key={round.id}
              onClick={() => { setActiveRound(round.id); setPlacementMode(false); }}
              className={cn(
                "flex flex-shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-all",
                isActive
                  ? "bg-fifa-teal/20 text-fifa-teal"
                  : "text-fifa-dark-gray hover:text-foreground hover:bg-white/5",
              )}
            >
              <span className="font-display text-sm tracking-wider">
                {round.shortLabel}
              </span>
              <span className={cn(
                "text-[9px]",
                isActive ? "text-fifa-teal/70" : "text-fifa-dark-gray/50",
              )}>
                {predicted}/{round.matchCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Round label */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-fifa-dark-gray">
        {roundInfo?.label}
      </h2>

      {/* Match rows */}
      <div className="space-y-2">
        {roundMatches.map((match) => (
          <KnockoutPlanillaMatchRow
            key={match.id}
            match={match}
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

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
