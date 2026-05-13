"use client";

import { useState, useCallback, useRef } from "react";
import { KnockoutRound } from "@/types";
import { getKnockoutMatchesByRound, knockoutMatches as allKnockoutMatches } from "@/data/knockoutMatches";
import { knockoutComodines } from "@/data/knockoutComodines";
import { knockoutGroupings } from "@/data/knockoutGroupings";
import { KnockoutPlanillaMatchRow } from "./KnockoutPlanillaMatchRow";
import { KnockoutComodinDock } from "./KnockoutComodinDock";
import { Toast } from "./Toast";
import { usePlanilla } from "@/context/PlanillaContext";
import { cn } from "@/lib/utils";

type PlanillaRound = "R32" | "R16" | "QF" | "SF" | "FINAL";

const planillaRoundTabs: { id: PlanillaRound; label: string; rounds: KnockoutRound[] }[] = [
  { id: "R32", label: "Dieciseisavos", rounds: ["R32"] },
  { id: "R16", label: "Octavos", rounds: ["R16"] },
  { id: "QF", label: "Cuartos", rounds: ["QF"] },
  { id: "SF", label: "Semifinal", rounds: ["SF"] },
  { id: "FINAL", label: "Final", rounds: ["3P", "F"] },
];

export function KnockoutPlanillaView() {
  const [activeTab, setActiveTab] = useState<PlanillaRound>("R32");
  const { predictions } = usePlanilla();
  const [comodinByRound, setComodinByRound] = useState<Record<string, string | null>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const dropSucceeded = useRef(false);

  const currentTab = planillaRoundTabs.find((t) => t.id === activeTab)!;
  const activeRounds = currentTab.rounds;

  // Comodin is per tab
  const comodinMatchId = comodinByRound[activeTab] ?? null;
  const comodinRound = activeRounds[0] as KnockoutRound;
  const comodin = knockoutComodines[comodinRound];

  // Collect all match IDs for this tab's rounds
  const allTabMatchIds = activeRounds.flatMap((r) =>
    getKnockoutMatchesByRound(r).map((m) => m.id),
  );

  const handleComodinDrop = useCallback((matchId: string) => {
    dropSucceeded.current = true;
    setComodinByRound((prev) => ({ ...prev, [activeTab]: matchId }));
    setPlacementMode(false);
  }, [activeTab]);

  const handleComodinRemove = useCallback(() => {
    setComodinByRound((prev) => ({ ...prev, [activeTab]: null }));
  }, [activeTab]);

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

  // Collect all groups across rounds for this tab
  const allGroups = activeRounds.flatMap((r) => knockoutGroupings[r as KnockoutRound] ?? []);
  const pairs: (typeof allGroups)[] = [];
  for (let i = 0; i < allGroups.length; i += 2) {
    pairs.push(allGroups.slice(i, i + 2));
  }

  return (
    <div className="space-y-4">
      {/* Round tabs */}
      <div className="flex overflow-x-auto rounded-full bg-surface p-1 ring-1 ring-white/5">
        {planillaRoundTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPlacementMode(false); }}
              className={cn(
                "flex-1 flex-shrink-0 rounded-full px-4 py-2 font-display text-base uppercase tracking-wider transition-all duration-200",
                isActive
                  ? "bg-fifa-teal text-white shadow-lg shadow-fifa-teal/20"
                  : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-teal/10 cursor-pointer",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Round label */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-fifa-dark-gray">
        {currentTab.label}
      </h2>

      {/* Match rows grouped in pairs */}
      <div className={cn(
        "space-y-6",
        allGroups.length <= 2 && "max-w-lg",
      )}>
        {pairs.map((pair, pi) => (
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
