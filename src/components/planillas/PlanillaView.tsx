"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { LockCountdown } from "./LockCountdown";
import { getComodinConfig } from "@/data/comodinConfig";
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
  const [comodinByFecha, setComodinByFecha] = useState<Record<string, string | null>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const dropSucceeded = useRef(false);
  const [locks, setLocks] = useState<Record<string, { locksAt: string; isLocked: boolean }>>({});
  const [matchSettings, setMatchSettings] = useState<Record<string, { comodinAllowed: boolean; exactScore: boolean }>>({});
  const [exactScores, setExactScores] = useState<Record<string, { homeScore: number; awayScore: number }>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/comodines").then((r) => r.ok ? r.json() : { comodines: {} }),
      fetch("/api/locks").then((r) => r.ok ? r.json() : { locks: {} }),
      fetch("/api/match-settings").then((r) => r.ok ? r.json() : { settings: {} }),
      fetch("/api/exact-score").then((r) => r.ok ? r.json() : { predictions: {} }),
    ]).then(([comodinData, lockData, settingsData, exactData]) => {
      setComodinByFecha(comodinData.comodines);
      setLocks(lockData.locks);
      setMatchSettings(settingsData.settings);
      setExactScores(exactData.predictions);
    }).catch(() => {});
  }, []);

  const isFechaLocked = locks[`fecha-${fecha}`]?.isLocked ?? false;

  const allFechaMatchIds = matches
    .filter((m) => m.matchday === fecha)
    .map((m) => m.id);

  const doubleMatchId = allFechaMatchIds.find(
    (id) => predictions[id]?.outcome.length === 2,
  ) ?? null;

  const comodinScope = `fecha-${fecha}`;
  const comodinMatchId = comodinByFecha[comodinScope] ?? null;

  // If admin has configured any comodin restrictions, only allow on marked matches
  const hasComodinRestrictions = Object.values(matchSettings).some((s) => s.comodinAllowed);

  const handleComodinDrop = useCallback(async (matchId: string) => {
    const pred = predictions[matchId];
    if (pred && pred.outcome.length === 2) {
      const singleOutcome = pred.outcome[0] as "L" | "E" | "V";
      await setPrediction(matchId, singleOutcome);
      setToast(`Se removió el DOBLE de ${matchLabel(matchId)}`);
    }
    dropSucceeded.current = true;
    const scope = `fecha-${fecha}`;
    setComodinByFecha((prev) => ({ ...prev, [scope]: matchId }));
    setPlacementMode(false);
    try {
      const res = await fetch("/api/comodines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, matchId }),
      });
      if (res.ok) {
        setToast("✓ Comodín guardado");
      } else {
        setComodinByFecha((prev) => ({ ...prev, [scope]: null }));
        setToast("✗ Error al guardar comodín");
      }
    } catch {
      setComodinByFecha((prev) => ({ ...prev, [scope]: null }));
      setToast("✗ Error al guardar comodín");
    }
  }, [predictions, setPrediction, fecha]);

  const handleComodinRemove = useCallback(async () => {
    try {
      await fetch("/api/comodines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: `fecha-${fecha}` }),
      });
    } catch {}
    setComodinByFecha((prev) => ({ ...prev, [`fecha-${fecha}`]: null }));
  }, [fecha]);

  const handleDoubleAttemptOnComodin = useCallback(async () => {
    try {
      await fetch("/api/comodines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: `fecha-${fecha}` }),
      });
    } catch {}
    setComodinByFecha((prev) => ({ ...prev, [`fecha-${fecha}`]: null }));
    setToast("Se removió el COMODÍN — no se puede combinar con DOBLE");
  }, [fecha]);

  const [comodinReject, setComodinReject] = useState<string | null>(null);
  const rejectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suppressBubble, setSuppressBubble] = useState(false);

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

  const [comodinDragging, setComodinDragging] = useState(false);

  const handleComodinDragStart = useCallback(() => {
    dropSucceeded.current = false;
    setComodinDragging(true);
  }, []);

  const handleComodinDragEnd = useCallback(() => {
    setComodinDragging(false);
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
          <PlanillaTabs active={fecha} onChange={(f) => { setFecha(f); setPlacementMode(false); }} locks={locks} />

          {isFechaLocked ? (
            <div className="flex items-center gap-2 rounded-xl bg-fifa-dark-gray/20 px-4 py-3 ring-1 ring-white/5">
              <span className="text-lg">🔒</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Fecha cerrada</p>
                <p className="text-xs text-fifa-dark-gray">Las predicciones ya no se pueden modificar</p>
              </div>
            </div>
          ) : locks[`fecha-${fecha}`]?.locksAt ? (
            <LockCountdown locksAt={locks[`fecha-${fecha}`].locksAt} />
          ) : null}

          <div className="space-y-6">
            {groupPairs.map(([a, b]) => (
              <GroupPairCard
                key={`${a.id}-${b.id}`}
                groupA={a}
                groupB={b}
                matchday={fecha}
                fechaLocked={isFechaLocked}
                doubleMatchId={doubleMatchId}
                comodinMatchId={comodinMatchId}
                comodinImage={getComodinConfig(`fecha-${fecha}`).image}
                placementMode={isFechaLocked ? false : placementMode}
                comodinDragging={comodinDragging}
                matchSettings={matchSettings}
                exactScores={exactScores}
                onExactScoreChange={setExactScores}
                onComodinDrop={handleComodinDrop}
                onComodinReject={handleComodinReject}
                onComodinRemove={handleComodinRemove}
                onComodinDragStart={handleComodinDragStart}
                onComodinDragEnd={handleComodinDragEnd}
                onDoubleAttemptOnComodin={handleDoubleAttemptOnComodin}
              />
            ))}
          </div>

          {!isFechaLocked && (
            <ComodinDock
              isPlaced={comodinMatchId !== null}
              isPlacementMode={placementMode}
              rejectMessage={comodinReject}
              suppressBubble={suppressBubble}
              onTogglePlacementMode={handleTogglePlacementMode}
              onDragStart={handleComodinDragStart}
              onDragEnd={handleComodinDragEnd}
              image={getComodinConfig(`fecha-${fecha}`).image}
            />
          )}

          <BonusPredictions locked={isFechaLocked} />
        </>
      ) : (
        <KnockoutPlanillaView />
      )}

      <SaveIndicator />
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
