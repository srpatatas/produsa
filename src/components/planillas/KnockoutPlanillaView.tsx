"use client";

import { useState, useCallback, useRef } from "react";
import { KnockoutRound } from "@/types";
import { knockoutRounds } from "@/data/knockoutBracket";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { knockoutComodines } from "@/data/knockoutComodines";
import { KnockoutPlanillaMatchRow } from "./KnockoutPlanillaMatchRow";
import { KnockoutComodinDock } from "./KnockoutComodinDock";
import { Toast } from "./Toast";
import { usePlanilla } from "@/context/PlanillaContext";
import { cn } from "@/lib/utils";

export function KnockoutPlanillaView() {
  const [activeRound, setActiveRound] = useState<KnockoutRound>("R32");
  const { predictions } = usePlanilla();
  const [comodinByRound, setComodinByRound] = useState<Record<string, string | null>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const dropSucceeded = useRef(false);

  const roundMatches = getKnockoutMatchesByRound(activeRound);
  const comodinMatchId = comodinByRound[activeRound] ?? null;
  const comodin = knockoutComodines[activeRound];

  const handleComodinDrop = useCallback((matchId: string) => {
    dropSucceeded.current = true;
    setComodinByRound((prev) => ({ ...prev, [activeRound]: matchId }));
    setPlacementMode(false);
  }, [activeRound]);

  const handleComodinRemove = useCallback(() => {
    setComodinByRound((prev) => ({ ...prev, [activeRound]: null }));
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
      <div className="flex overflow-x-auto rounded-full bg-surface p-1 ring-1 ring-white/5">
        {knockoutRounds.map((round) => {
          const isActive = activeRound === round.id;

          return (
            <button
              key={round.id}
              onClick={() => { setActiveRound(round.id); setPlacementMode(false); }}
              className={cn(
                "flex-1 flex-shrink-0 rounded-full px-4 py-2 font-display text-sm uppercase tracking-wider transition-all",
                isActive
                  ? "bg-fifa-teal text-white shadow-lg shadow-fifa-teal/20"
                  : "text-fifa-dark-gray hover:text-foreground",
              )}
            >
              {round.shortLabel}
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
            comodinMatchId={comodinMatchId}
            comodinEmoji={comodin.emoji}
            comodinImage={comodin.image}
            placementMode={placementMode}
            onComodinDrop={handleComodinDrop}
            onComodinRemove={handleComodinRemove}
            onComodinDragStart={handleComodinDragStart}
            onComodinDragEnd={handleComodinDragEnd}
          />
        ))}
      </div>

      <KnockoutComodinDock
        isPlaced={comodinMatchId !== null}
        isPlacementMode={placementMode}
        onTogglePlacementMode={handleTogglePlacementMode}
        emoji={comodin.emoji}
        image={comodin.image}
        name={comodin.name}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
