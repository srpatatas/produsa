"use client";

import { useState, useCallback, useRef } from "react";
import { KnockoutRound } from "@/types";
import { knockoutRounds } from "@/data/knockoutBracket";
import { getKnockoutMatchesByRound, knockoutMatches as allKnockoutMatches } from "@/data/knockoutMatches";
import { knockoutComodines } from "@/data/knockoutComodines";
import { knockoutGroupings } from "@/data/knockoutGroupings";
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
                "flex-1 flex-shrink-0 rounded-full px-4 py-2 font-display text-base uppercase tracking-wider transition-all",
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

      {/* Match rows grouped in pairs */}
      <div className="space-y-6">
        {(() => {
          const groups = knockoutGroupings[activeRound] ?? [];
          const pairs: (typeof groups)[] = [];
          for (let i = 0; i < groups.length; i += 2) {
            pairs.push(groups.slice(i, i + 2));
          }
          return pairs.map((pair, pi) => (
            <div key={pi} className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              {pair.map((group) => {
                const groupMatches = group.matchIds
                  .map((id) => allKnockoutMatches.find((m) => m.id === id))
                  .filter(Boolean) as typeof allKnockoutMatches;

                return (
                  <div key={group.label} className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${group.gradient}`} />
                      <span className="font-display text-base tracking-wider text-fifa-dark-gray">
                        {group.label}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {groupMatches.map((match) => (
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
                  </div>
                );
              })}
            </div>
          ));
        })()}
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
