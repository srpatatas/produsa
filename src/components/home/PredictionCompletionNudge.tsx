"use client";

import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
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
  "fecha-1": "F1",
  "fecha-2": "F2",
  "fecha-3": "F3",
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
      if (locks[scope]?.isLocked) return false;
      if (knockoutScopeRounds[scope] && !isScopePredictable(scope)) return false;
      return true;
    })
    .sort(([a], [b]) => (scopeOrder.indexOf(a) ?? 99) - (scopeOrder.indexOf(b) ?? 99));

  if (all.length === 0) return null;

  return (
    <div className="inline-flex flex-col rounded-xl bg-surface/60 px-4 py-2.5 ring-1 ring-white/5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-fifa-dark-gray">
        Estado de predicciones
      </p>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        {all.map(([scope, status]) => {
          const pct = status.total > 0 ? Math.round((status.completed / status.total) * 100) : 0;
          const complete = pct === 100;
          const m = status.matches;
          const b = status.bonus;

          return (
            <div key={scope} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-fifa-dark-gray">
                  {scopeLabels[scope] ?? scope}
                </span>
                <div className="h-1.5 w-14 rounded-full bg-white/5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      complete ? "bg-fifa-green" : "bg-fifa-blue"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-[10px] font-semibold ${
                  complete ? "text-fifa-green" : "text-fifa-dark-gray/70"
                }`}>
                  {pct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 pl-0.5">
                {m && m.total > 0 && (
                  <span className={`text-[9px] font-medium ${m.completed === m.total ? "text-fifa-green" : "text-fifa-dark-gray"}`}>
                    {m.completed}/{m.total} partidos
                  </span>
                )}
                {b && b.total > 0 && (
                  <span className={`text-[9px] font-medium ${b.completed === b.total ? "text-fifa-green" : "text-fifa-dark-gray"}`}>
                    {b.completed}/{b.total} bonus
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
