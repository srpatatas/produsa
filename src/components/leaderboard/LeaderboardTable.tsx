"use client";

import { LeaderboardEntry } from "@/types";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { RankMovement } from "./RankMovement";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const currentUser = useUser();

  return (
    <div className="space-y-2.5">
      {entries.map((entry, i) => {
        const isCurrentUser = entry.user.id === currentUser.id;
        const isTop3 = i < 3;

        return (
          <div
            key={entry.user.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-black/5 ring-1 ring-black/[0.03] transition-all",
              isCurrentUser && "ring-2 ring-fifa-blue/20",
            )}
          >
            <div className="flex w-8 flex-shrink-0 items-center justify-center">
              {isTop3 ? (
                <span className="text-xl">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </span>
              ) : (
                <span className="font-display text-lg text-fifa-dark-gray">
                  {i + 1}
                </span>
              )}
            </div>

            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xl">
              {entry.user.avatar}
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
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
                <span className="text-fifa-dark-gray/30">·</span>
                <span>{entry.correctOutcomes} aciertos</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="font-display text-3xl text-foreground">
                {entry.points}
              </span>
              <span className="text-[10px] font-medium text-fifa-dark-gray">pts</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
