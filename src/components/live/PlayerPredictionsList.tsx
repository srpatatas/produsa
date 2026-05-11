"use client";

import { PlayerMatchPrediction } from "@/data/playerPredictions";
import { LiveScore } from "@/data/liveScores";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

interface PlayerPredictionsListProps {
  predictions: PlayerMatchPrediction[];
  liveScore: LiveScore;
}

function getOutcome(home: number, away: number): "home" | "draw" | "away" {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function PlayerPredictionsList({
  predictions,
  liveScore,
}: PlayerPredictionsListProps) {
  const currentUser = useUser();
  const liveOutcome = getOutcome(liveScore.homeScore, liveScore.awayScore);

  const sorted = [...predictions].sort((a, b) => {
    const aExact =
      a.homeScore === liveScore.homeScore &&
      a.awayScore === liveScore.awayScore;
    const bExact =
      b.homeScore === liveScore.homeScore &&
      b.awayScore === liveScore.awayScore;
    if (aExact !== bExact) return aExact ? -1 : 1;

    const aOutcome = getOutcome(a.homeScore, a.awayScore) === liveOutcome;
    const bOutcome = getOutcome(b.homeScore, b.awayScore) === liveOutcome;
    if (aOutcome !== bOutcome) return aOutcome ? -1 : 1;

    return 0;
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-fifa-dark-gray">
        Predicciones
      </h3>
      {sorted.map((pred) => {
        const isCurrentUser = pred.user.id === currentUser.id;
        const predOutcome = getOutcome(pred.homeScore, pred.awayScore);
        const isExactMatch =
          pred.homeScore === liveScore.homeScore &&
          pred.awayScore === liveScore.awayScore;
        const isCorrectOutcome = predOutcome === liveOutcome;

        return (
          <div
            key={pred.user.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-black/5 ring-1 ring-black/[0.03] transition-all",
              isExactMatch && "ring-2 ring-emerald-400/50 bg-emerald-50/50",
              !isExactMatch && isCorrectOutcome && "ring-2 ring-blue-400/30 bg-blue-50/50",
              isCurrentUser && !isExactMatch && !isCorrectOutcome && "ring-2 ring-fifa-blue/20",
            )}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xl">
              {pred.user.avatar}
            </div>

            <div className="flex flex-1 flex-col">
              <span className="text-sm font-semibold text-foreground">
                {pred.user.name}
                {isCurrentUser && (
                  <span className="ml-1 text-xs font-normal text-fifa-dark-gray">
                    (vos)
                  </span>
                )}
              </span>
              <span className={cn(
                "text-[11px] font-medium",
                isExactMatch
                  ? "text-emerald-600"
                  : isCorrectOutcome
                    ? "text-blue-600"
                    : "text-fifa-dark-gray",
              )}>
                {isExactMatch
                  ? "🎯 Acertando exacto"
                  : isCorrectOutcome
                    ? "✓ Acertando resultado"
                    : "✗ No acierta"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-display text-2xl tracking-wider text-foreground">
              <span>{pred.homeScore}</span>
              <span className="text-base text-fifa-dark-gray/30">:</span>
              <span>{pred.awayScore}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
