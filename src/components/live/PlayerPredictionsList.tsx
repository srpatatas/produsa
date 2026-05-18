"use client";

import { LiveScore } from "@/types";
import { useUser } from "@/context/UserContext";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { cn } from "@/lib/utils";
import { getOutcomeLabel, getOutcomeBg, getLiveOutcome } from "@/lib/outcomeStyles";

export interface LivePlayerPrediction {
  user: { id: number; name: string; avatar: string };
  outcome: string;
}

interface PlayerPredictionsListProps {
  predictions: LivePlayerPrediction[];
  liveScore: LiveScore;
}

export function PlayerPredictionsList({
  predictions,
  liveScore,
}: PlayerPredictionsListProps) {
  const currentUser = useUser();
  const hasScore = liveScore.homeScore >= 0 && liveScore.awayScore >= 0;
  const liveOutcome = hasScore ? getLiveOutcome(liveScore.homeScore, liveScore.awayScore) : null;

  const sorted = [...predictions].sort((a, b) => {
    if (!liveOutcome) return 0;
    const aCorrect = a.outcome.includes(liveOutcome);
    const bCorrect = b.outcome.includes(liveOutcome);
    if (aCorrect !== bCorrect) return aCorrect ? -1 : 1;
    return 0;
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-fifa-dark-gray">
        Predicciones
      </h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-fifa-dark-gray/50 py-4 text-center">
          Nadie predijo este partido todavía
        </p>
      ) : (
        sorted.map((pred) => {
          const isCurrentUser = pred.user.id === currentUser.id;
          const isCorrect = liveOutcome ? pred.outcome.includes(liveOutcome) : null;

          const pillBg = getOutcomeBg(pred.outcome);

          return (
            <div
              key={pred.user.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl bg-card-bg p-4 shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all duration-200 hover:ring-white/15 hover:shadow-md hover:shadow-black/30",
                isCorrect === true && "ring-2 ring-fifa-green/30",
                isCorrect === false && "ring-2 ring-fifa-red/20",
                isCurrentUser && isCorrect === null && "ring-2 ring-fifa-blue/20",
              )}
            >
              <AvatarDisplay avatar={pred.user.avatar} size="md" />

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
                  isCorrect === true ? "text-fifa-green"
                    : isCorrect === false ? "text-fifa-red/70"
                    : "text-fifa-dark-gray",
                )}>
                  {hasScore
                    ? isCorrect ? "Acertando" : "No acierta"
                    : "Esperando resultado"}
                </span>
              </div>

              <div className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold text-white", pillBg)}>
                {getOutcomeLabel(pred.outcome)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
