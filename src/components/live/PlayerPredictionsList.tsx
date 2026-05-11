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
      <h3 className="font-display text-sm font-semibold text-fifa-dark-gray">
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
              "flex items-center gap-3 rounded-xl border bg-card-bg px-4 py-3 shadow-sm",
              isExactMatch
                ? "border-fifa-green bg-fifa-green-light"
                : isCorrectOutcome
                  ? "border-fifa-blue/30 bg-fifa-blue-light"
                  : "border-card-border",
              isCurrentUser && "ring-2 ring-fifa-blue/30",
            )}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface text-lg">
              {pred.user.avatar}
            </div>

            <div className="flex flex-1 flex-col">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isCurrentUser && "text-fifa-blue",
                )}
              >
                {pred.user.name}
                {isCurrentUser && (
                  <span className="ml-1 text-xs font-normal text-fifa-dark-gray">
                    (vos)
                  </span>
                )}
              </span>
              <span className="text-[11px] text-fifa-dark-gray">
                {isExactMatch
                  ? "🎯 Acertando exacto"
                  : isCorrectOutcome
                    ? "✓ Acertando resultado"
                    : "✗ No acierta"}
              </span>
            </div>

            <div className="flex items-center gap-1 text-lg font-bold text-foreground">
              <span>{pred.homeScore}</span>
              <span className="text-sm text-fifa-dark-gray">:</span>
              <span>{pred.awayScore}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
