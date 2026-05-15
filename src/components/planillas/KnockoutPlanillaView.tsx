"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { KnockoutRound } from "@/types";
import { getKnockoutMatchesByRound, knockoutMatches as allKnockoutMatches } from "@/data/knockoutMatches";
import { getComodinConfig } from "@/data/comodinConfig";
import { knockoutGroupings } from "@/data/knockoutGroupings";
import { KnockoutPlanillaMatchRow } from "./KnockoutPlanillaMatchRow";
import { ComodinDock } from "./ComodinDock";
import { Toast } from "./Toast";
import { usePlanilla } from "@/context/PlanillaContext";
import { LockCountdown } from "./LockCountdown";
import { isKnockoutMatchPredictable } from "@/lib/knockoutResolver";
import { cn } from "@/lib/utils";

type PlanillaRound = "R32" | "R16" | "QF" | "SF" | "FINAL";

const planillaRoundTabs: { id: PlanillaRound; label: string; rounds: KnockoutRound[] }[] = [
  { id: "R32", label: "Dieciseisavos", rounds: ["R32"] },
  { id: "R16", label: "Octavos", rounds: ["R16"] },
  { id: "QF", label: "Cuartos", rounds: ["QF"] },
  { id: "SF", label: "Semifinales", rounds: ["SF"] },
  { id: "FINAL", label: "Final", rounds: ["3P", "F"] },
];

export function KnockoutPlanillaView() {
  const [activeTab, setActiveTab] = useState<PlanillaRound>("R32");
  const { predictions } = usePlanilla();
  const [comodinByRound, setComodinByRound] = useState<Record<string, string | null>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const dropSucceeded = useRef(false);
  const [locks, setLocks] = useState<Record<string, { locksAt: string; isLocked: boolean }>>({});
  const [matchSettings, setMatchSettings] = useState<Record<string, { comodinAllowed: boolean; exactScore: boolean }>>({});
  const [comodinDragging, setComodinDragging] = useState(false);
  const [comodinReject, setComodinReject] = useState<string | null>(null);
  const [suppressBubble, setSuppressBubble] = useState(false);
  const rejectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/comodines").then((r) => r.ok ? r.json() : { comodines: {} }),
      fetch("/api/locks").then((r) => r.ok ? r.json() : { locks: {} }),
      fetch("/api/match-settings").then((r) => r.ok ? r.json() : { settings: {} }),
    ]).then(([comodinData, lockData, settingsData]) => {
      setComodinByRound(comodinData.comodines);
      setLocks(lockData.locks);
      setMatchSettings(settingsData.settings);
    }).catch(() => {});
  }, []);

  const currentTab = planillaRoundTabs.find((t) => t.id === activeTab)!;
  const activeRounds = currentTab.rounds;
  const isRoundLocked = locks[activeTab]?.isLocked ?? false;

  // Check if any match in this round has both teams resolved
  const roundMatches = activeRounds.flatMap((r) => getKnockoutMatchesByRound(r));
  const isRoundPredictable = roundMatches.some((m) => isKnockoutMatchPredictable(m));
  const effectiveLocked = isRoundLocked || !isRoundPredictable;

  // Comodin is per tab
  const comodinMatchId = comodinByRound[activeTab] ?? null;
  const comodin = getComodinConfig(activeTab);

  // Collect all match IDs for this tab's rounds
  const allTabMatchIds = activeRounds.flatMap((r) =>
    getKnockoutMatchesByRound(r).map((m) => m.id),
  );

  const handleComodinDrop = useCallback(async (matchId: string) => {
    dropSucceeded.current = true;
    setComodinByRound((prev) => ({ ...prev, [activeTab]: matchId }));
    setPlacementMode(false);
    try {
      const res = await fetch("/api/comodines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: activeTab, matchId }),
      });
      if (res.ok) {
        setToast("✓ Comodín guardado");
      } else {
        setComodinByRound((prev) => ({ ...prev, [activeTab]: null }));
        setToast("✗ Error al guardar comodín");
      }
    } catch {
      setComodinByRound((prev) => ({ ...prev, [activeTab]: null }));
      setToast("✗ Error al guardar comodín");
    }
  }, [activeTab]);

  const handleComodinRemove = useCallback(async () => {
    setComodinByRound((prev) => ({ ...prev, [activeTab]: null }));
    try {
      await fetch("/api/comodines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: activeTab }),
      });
    } catch {}
  }, [activeTab]);

  const handleComodinReject = useCallback((message: string) => {
    if (rejectTimer.current) clearTimeout(rejectTimer.current);
    setComodinReject(message);
    setSuppressBubble(true);
    rejectTimer.current = setTimeout(() => {
      setComodinReject(null);
      setTimeout(() => setSuppressBubble(false), 1000);
    }, 3000);
  }, []);

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
    setComodinDragging(true);
  }, []);

  const handleComodinDragEnd = useCallback(() => {
    setComodinDragging(false);
    if (!dropSucceeded.current) handleComodinRemove();
  }, [handleComodinRemove]);

  // Collect all groups across rounds for this tab
  const allGroups = activeRounds.flatMap((r) => knockoutGroupings[r as KnockoutRound] ?? []);
  const stackVertically = allGroups.length <= 1 || activeTab === "FINAL";
  const pairs: (typeof allGroups)[] = [];
  if (stackVertically) {
    for (const g of allGroups) pairs.push([g]);
  } else {
    for (let i = 0; i < allGroups.length; i += 2) {
      pairs.push(allGroups.slice(i, i + 2));
    }
  }

  return (
    <div className="space-y-4">
      {/* Round tabs */}
      <div className="flex overflow-x-auto rounded-full bg-surface p-1 ring-1 ring-white/5">
        {planillaRoundTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const tabLocked = locks[tab.id]?.isLocked ?? false;
          const tabMatches = tab.rounds.flatMap((r) => getKnockoutMatchesByRound(r as KnockoutRound));
          const tabPredictable = tabMatches.some((m) => isKnockoutMatchPredictable(m));
          const tabDisabled = tabLocked || !tabPredictable;

          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPlacementMode(false); }}
              className={cn(
                "flex-1 flex-shrink-0 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 font-display text-base uppercase tracking-wider transition-all duration-200",
                isActive
                  ? tabDisabled
                    ? "bg-fifa-dark-gray/50 text-white/70"
                    : "bg-fifa-teal text-white shadow-lg shadow-fifa-teal/20"
                  : "text-fifa-dark-gray hover:text-foreground hover:bg-fifa-teal/10 cursor-pointer",
              )}
            >
              {tabLocked && <span className="text-sm">🔒</span>}
              {!tabPredictable && !tabLocked && <span className="text-sm">🔒</span>}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Round label */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-fifa-dark-gray">
        {currentTab.label}
      </h2>

      {isRoundLocked ? (
        <div className="flex items-center gap-2 rounded-xl bg-fifa-dark-gray/20 px-4 py-3 ring-1 ring-white/5">
          <span className="text-lg">🔒</span>
          <div>
            <p className="text-sm font-semibold text-foreground">Ronda cerrada</p>
            <p className="text-xs text-fifa-dark-gray">Las predicciones ya no se pueden modificar</p>
          </div>
        </div>
      ) : !isRoundPredictable ? (
        <div className="flex items-center gap-2 rounded-xl bg-fifa-purple/10 px-4 py-3 ring-1 ring-white/5">
          <span className="text-lg">🔒</span>
          <div>
            <p className="text-sm font-semibold text-foreground">Partidos por definir</p>
            <p className="text-xs text-fifa-dark-gray">Se habilitará cuando se definan los cruces</p>
          </div>
        </div>
      ) : locks[activeTab]?.locksAt ? (
        <LockCountdown locksAt={locks[activeTab].locksAt} />
      ) : null}

      {/* Match rows grouped in pairs */}
      <div className={cn(
        "space-y-6",
        stackVertically && "max-w-lg mx-auto",
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
                        featured={match.id === "F"}
                        roundLocked={effectiveLocked}
                        comodinMatchId={comodinMatchId}
                        comodinImage={comodin.image}
                        placementMode={effectiveLocked ? false : placementMode}
                        comodinDragging={comodinDragging}
                        comodinAllowed={matchSettings[match.id]?.comodinAllowed}
                        hasComodinRestrictions={Object.values(matchSettings).some((s) => s.comodinAllowed)}
                        onComodinDrop={handleComodinDrop}
                        onComodinReject={handleComodinReject}
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

      {!effectiveLocked && (
        <ComodinDock
          isPlaced={comodinMatchId !== null}
          isPlacementMode={placementMode}
          rejectMessage={comodinReject}
          suppressBubble={suppressBubble}
          onTogglePlacementMode={handleTogglePlacementMode}
          onDragStart={handleComodinDragStart}
          onDragEnd={handleComodinDragEnd}
          image={comodin.image}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
