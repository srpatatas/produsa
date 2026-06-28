"use client";

import React from "react";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { matches as groupMatches } from "@/data/matches";
import { cn } from "@/lib/utils";
import { KnockoutRound } from "@/types";

interface ScopeStatus {
  total: number;
  completed: number;
  matches?: { total: number; completed: number };
  bonus?: { total: number; completed: number };
  comodin?: boolean;
  doble?: boolean;
  exacto?: { total: number; completed: number } | null;
}

interface PredictionCompletionNudgeProps {
  predictionStatus: Record<string, ScopeStatus>;
  locks: Record<string, { locksAt: string; isLocked: boolean }>;
  knockoutPredictable?: Record<string, boolean>;
}

const scopeOrder = ["fecha-1", "fecha-2", "fecha-3", "R32", "R16", "QF", "SF", "FINAL"];

const scopeLabels: Record<string, string> = {
  "fecha-1": "FECHA 1",
  "fecha-2": "FECHA 2",
  "fecha-3": "FECHA 3",
  R32: "16vos",
  R16: "8vos",
  QF: "4tos",
  SF: "Semi",
  FINAL: "Final",
};

const knockoutScopeRounds: Record<string, KnockoutRound[]> = {
  R32: ["R32"],
  R16: ["R16"],
  QF: ["QF"],
  SF: ["SF"],
  FINAL: ["3P", "F"],
};

function isScopeFinished(scope: string): boolean {
  const now = Date.now();
  let lastKickoff = 0;

  const matchday = scope.match(/^fecha-(\d)$/)?.[1];
  if (matchday) {
    const scopeMatches = groupMatches.filter((m) => m.matchday === parseInt(matchday));
    if (scopeMatches.length === 0) return false;
    lastKickoff = Math.max(...scopeMatches.map((m) => new Date(m.kickoff).getTime()));
  } else {
    const rounds = knockoutScopeRounds[scope];
    if (!rounds) return false;
    const koMatches = rounds.flatMap((r) => getKnockoutMatchesByRound(r));
    if (koMatches.length === 0) return false;
    lastKickoff = Math.max(...koMatches.map((m) => new Date(m.kickoff).getTime()));
  }

  const nextDay = new Date(lastKickoff);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  return now >= nextDay.getTime();
}

function isScopePredictable(scope: string, knockoutPredictable?: Record<string, boolean>): boolean {
  if (!knockoutScopeRounds[scope]) return true;
  return knockoutPredictable?.[scope] ?? false;
}

function Chip({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9px] font-medium",
        done
          ? "bg-fifa-green/15 text-fifa-green"
          : "bg-white/5 text-fifa-dark-gray/60",
      )}
    >
      <span className="text-[8px]">{done ? "✓" : "✗"}</span>
      {label}
    </span>
  );
}

export function PredictionCompletionNudge({
  predictionStatus,
  locks,
  knockoutPredictable,
}: PredictionCompletionNudgeProps) {
  const all = Object.entries(predictionStatus)
    .filter(([scope]) => {
      if (isScopeFinished(scope)) return false;
      if (knockoutScopeRounds[scope] && !isScopePredictable(scope, knockoutPredictable)) return false;
      return true;
    })
    .sort(([a], [b]) => (scopeOrder.indexOf(a) ?? 99) - (scopeOrder.indexOf(b) ?? 99));

  if (all.length === 0) return null;

  return (
    <div className="mx-auto max-w-md w-full rounded-xl bg-surface/60 px-4 py-2.5 ring-1 ring-white/5 overflow-hidden">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-fifa-dark-gray">
        Estado de tus pronósticos
      </p>
      <div className="flex flex-col gap-2">
        {all.map(([scope, status]) => {
          const m = status.matches;
          const b = status.bonus;
          const isLocked = locks[scope]?.isLocked;
          const lockDate = locks[scope]?.locksAt ? new Date(locks[scope].locksAt) : null;
          const lockStr = lockDate ? lockDate.toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : null;
          const rowOpacity = isLocked ? "opacity-50" : "";

          const hasComodin = status.comodin ?? false;
          const hasDoble = status.doble ?? false;
          const exacto = status.exacto;
          const isKnockout = !!knockoutScopeRounds[scope];

          let totalItems = (m?.total ?? 0) + (b?.total ?? 0) + 1; // +1 comodin
          let doneItems = (m?.completed ?? 0) + (b?.completed ?? 0) + (hasComodin ? 1 : 0);
          if (!isKnockout) { totalItems += 1; doneItems += hasDoble ? 1 : 0; }
          if (exacto) { totalItems += exacto.total; doneItems += exacto.completed; }

          const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
          const fullyComplete = doneItems === totalItems;

          return (
            <div key={scope} className={cn("flex flex-col gap-1", rowOpacity)}>
              <div className="grid items-center gap-x-2" style={{ gridTemplateColumns: "auto 1fr auto auto" }}>
                <span className="text-[11px] font-semibold text-fifa-dark-gray whitespace-nowrap">
                  {scopeLabels[scope] ?? scope}
                </span>
                <div className="h-1.5 min-w-8 rounded-full bg-white/5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      fullyComplete ? "bg-fifa-green" : "bg-fifa-blue"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap text-right ${
                  fullyComplete ? "text-fifa-green" : "text-fifa-dark-gray/70"
                }`}>
                  {pct}%
                </span>
                <span className="text-[9px] text-fifa-dark-gray whitespace-nowrap text-right">
                  {lockStr ? `${isLocked ? "🔒" : "🔓"} ${lockStr}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pl-0.5">
                {m && m.total > 0 && (
                  <Chip done={m.completed === m.total} label={`${m.completed}/${m.total} part.`} />
                )}
                {b && b.total > 0 && (
                  <Chip done={b.completed === b.total} label={`${b.completed}/${b.total} bonus`} />
                )}
                <Chip done={hasComodin} label="Comodín" />
                {!isKnockout && <Chip done={hasDoble} label="Doble" />}
                {exacto && (
                  <Chip done={exacto.completed === exacto.total} label="Exacto" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
