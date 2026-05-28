"use client";

import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { matches as groupMatches } from "@/data/matches";
import { cn } from "@/lib/utils";
import { isKnockoutMatchPredictable } from "@/lib/knockoutResolver";
import { KnockoutRound } from "@/types";

interface ScopeStatus {
  total: number;
  completed: number;
  matches?: { total: number; completed: number };
  bonus?: { total: number; completed: number };
}

interface PredictionCompletionNudgeProps {
  predictionStatus: Record<string, ScopeStatus>;
  locks: Record<string, { locksAt: string; isLocked: boolean }>;
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

function isScopePredictable(scope: string): boolean {
  const rounds = knockoutScopeRounds[scope];
  if (!rounds) return true;
  const matches = rounds.flatMap((r) => getKnockoutMatchesByRound(r));
  return matches.length > 0 && matches.every((m) => isKnockoutMatchPredictable(m));
}

export function PredictionCompletionNudge({
  predictionStatus,
  locks,
}: PredictionCompletionNudgeProps) {
  const all = Object.entries(predictionStatus)
    .filter(([scope]) => {
      if (isScopeFinished(scope)) return false;
      if (knockoutScopeRounds[scope] && !isScopePredictable(scope)) return false;
      return true;
    })
    .sort(([a], [b]) => (scopeOrder.indexOf(a) ?? 99) - (scopeOrder.indexOf(b) ?? 99));

  if (all.length === 0) return null;

  return (
    <div className="mx-auto max-w-md w-full rounded-xl bg-surface/60 px-4 py-2.5 ring-1 ring-white/5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-fifa-dark-gray">
        Estado de tus pronósticos
      </p>
      <div className="flex justify-center">
      <div className="inline-flex flex-col gap-2">
        {all.map(([scope, status]) => {
          const pct = status.total > 0 ? Math.round((status.completed / status.total) * 100) : 0;
          const complete = pct === 100;
          const m = status.matches;
          const b = status.bonus;
          const lockDate = locks[scope]?.locksAt ? new Date(locks[scope].locksAt) : null;
          const lockStr = lockDate ? lockDate.toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : null;

          return (
            <div key={scope} className={cn("flex items-center gap-1.5", locks[scope]?.isLocked && "opacity-50")}>
              <span className="text-[11px] font-semibold text-fifa-dark-gray whitespace-nowrap">
                {scopeLabels[scope] ?? scope}
              </span>
              <div className="h-1.5 w-20 flex-shrink-0 rounded-full bg-white/5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    complete ? "bg-fifa-green" : "bg-fifa-blue"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap w-8 text-right ${
                complete ? "text-fifa-green" : "text-fifa-dark-gray/70"
              }`}>
                {pct}%
              </span>
              <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                {m && m.total > 0 && (
                  <span className={`text-[9px] font-medium whitespace-nowrap ${m.completed === m.total ? "text-fifa-green" : "text-fifa-dark-gray"}`}>
                    {m.completed}/{m.total} part.
                  </span>
                )}
                {b && b.total > 0 && (
                  <span className={`text-[9px] font-medium whitespace-nowrap ${b.completed === b.total ? "text-fifa-green" : "text-fifa-dark-gray"}`}>
                    {b.completed}/{b.total} bonus
                  </span>
                )}
              </div>
              {lockStr && (
                <span className="text-[9px] text-fifa-dark-gray whitespace-nowrap">
                  {locks[scope]?.isLocked ? "🔒" : "🔓"} {lockStr}
                </span>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
