"use client";

import { LeaderboardEntry } from "@/types";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { RankMovement } from "./RankMovement";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

const podiumStyles: Record<number, string> = {
  0: "bg-fifa-gold-light border-l-4 border-l-fifa-gold",
  1: "bg-gray-100/80 border-l-4 border-l-gray-400",
  2: "bg-orange-50/50 border-l-4 border-l-amber-700/50",
};

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const currentUser = useUser();

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const isCurrentUser = entry.user.id === currentUser.id;

        return (
          <div
            key={entry.user.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-card-border bg-card-bg px-4 py-3 shadow-sm transition-all",
              podiumStyles[i],
              isCurrentUser && "ring-2 ring-fifa-blue/30",
            )}
          >
            <div className="flex w-7 flex-shrink-0 items-center justify-center">
              {i < 3 ? (
                <span className="text-lg">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </span>
              ) : (
                <span className="text-sm font-bold text-fifa-dark-gray">
                  {i + 1}
                </span>
              )}
            </div>

            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xl">
              {entry.user.avatar}
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isCurrentUser && "text-fifa-blue",
                  )}
                >
                  {entry.user.name}
                  {isCurrentUser && (
                    <span className="ml-1 text-xs font-normal text-fifa-dark-gray">
                      (vos)
                    </span>
                  )}
                </span>
                <RankMovement currentRank={i + 1} previousRank={entry.previousRank} />
              </div>
              <div className="flex gap-3 text-[11px] text-fifa-dark-gray">
                <span>{entry.correctScores} exactos</span>
                <span>{entry.correctOutcomes} aciertos</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-lg font-bold text-foreground">
                {entry.points}
              </span>
              <span className="text-[10px] text-fifa-dark-gray">pts</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
