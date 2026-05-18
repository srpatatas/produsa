"use client";

import { useState, useEffect } from "react";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { getOutcomeBg, getLiveOutcome } from "@/lib/outcomeStyles";

interface PredictionEntry {
  user: { id: number; name: string; avatar: string };
  outcome: string;
  exactScore: { home: number; away: number } | null;
}

interface MatchPredictionsDropdownProps {
  matchId: string;
  actualOutcome?: "L" | "E" | "V";
}

const outcomeRing: Record<string, string> = {
  L: "ring-outcome-local",
  E: "ring-outcome-empate",
  V: "ring-outcome-visitante",
  LE: "ring-outcome-local",
  EL: "ring-outcome-local",
  EV: "ring-outcome-empate",
  VE: "ring-outcome-empate",
  LV: "ring-outcome-local",
  VL: "ring-outcome-local",
};

export function MatchPredictionsDropdown({ matchId, actualOutcome }: MatchPredictionsDropdownProps) {
  const [predictions, setPredictions] = useState<PredictionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/live-predictions?matchId=${matchId}`)
      .then((r) => r.ok ? r.json() : { predictions: [] })
      .then((data) => setPredictions(data.predictions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) {
    return (
      <div className="px-4 py-3 text-center text-xs text-fifa-dark-gray/50">
        Cargando predicciones...
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="px-4 py-3 text-center text-xs text-fifa-dark-gray/50">
        Nadie predijo este partido
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-1" style={{ animation: "slideDown 0.2s ease-out" }}>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {predictions.map((pred) => {
          const isCorrect = actualOutcome ? pred.outcome.includes(actualOutcome) : null;
          const dimmed = isCorrect === false;
          const hasExact = !!pred.exactScore;
          const ringOutcome = hasExact
            ? getLiveOutcome(pred.exactScore!.home, pred.exactScore!.away)
            : pred.outcome;
          const badgeBg = hasExact
            ? getOutcomeBg(getLiveOutcome(pred.exactScore!.home, pred.exactScore!.away))
            : getOutcomeBg(pred.outcome);
          const badgeLabel = hasExact
            ? `${pred.exactScore!.home}-${pred.exactScore!.away}`
            : pred.outcome;

          return (
            <div key={pred.user.id} className={`flex flex-col items-center gap-1.5 transition-opacity ${dimmed ? "opacity-30" : ""}`}>
              <div className="relative mb-1">
                <div className={`rounded-full ring-2 ${outcomeRing[ringOutcome] ?? "ring-white/20"}`}>
                  <AvatarDisplay avatar={pred.user.avatar} size="lg" />
                </div>
                <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[9px] font-bold text-white whitespace-nowrap ${badgeBg}`}>
                  {badgeLabel}
                </span>
              </div>
              <span className="text-[10px] text-fifa-dark-gray truncate max-w-full">
                {pred.user.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
