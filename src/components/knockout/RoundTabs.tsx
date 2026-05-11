"use client";

import { KnockoutRound } from "@/types";
import { knockoutRounds } from "@/data/knockoutBracket";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { usePredictions } from "@/context/PredictionsContext";
import { cn } from "@/lib/utils";

interface RoundTabsProps {
  active: KnockoutRound;
  onChange: (round: KnockoutRound) => void;
}

export function RoundTabs({ active, onChange }: RoundTabsProps) {
  const { predictions } = usePredictions();

  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-card-bg p-1 ring-1 ring-white/5">
      {knockoutRounds.map((round) => {
        const matches = getKnockoutMatchesByRound(round.id);
        const predicted = matches.filter((m) => predictions[m.id]).length;
        const isActive = active === round.id;

        return (
          <button
            key={round.id}
            onClick={() => onChange(round.id)}
            className={cn(
              "flex flex-shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-all",
              isActive
                ? "bg-fifa-purple/20 text-fifa-purple"
                : "text-fifa-dark-gray hover:text-foreground hover:bg-white/5",
            )}
          >
            <span className="font-display text-xs tracking-wider">
              {round.shortLabel}
            </span>
            <span className={cn(
              "text-[9px]",
              isActive ? "text-fifa-purple/70" : "text-fifa-dark-gray/50",
            )}>
              {predicted}/{round.matchCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
