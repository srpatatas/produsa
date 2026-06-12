"use client";

import { memo } from "react";
import Image from "next/image";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { getOutcomeBg, getOutcomeLabel, getLiveOutcome } from "@/lib/outcomeStyles";
import { cn } from "@/lib/utils";

const BIRTHDAYS: Record<string, string> = {
  "Chekoloko": "06-11",
  "El Poeta": "06-13",
  "La Tia de todos": "06-29",
};

function isBirthday(name: string) {
  const mmdd = BIRTHDAYS[name];
  if (!mmdd) return false;
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return today === mmdd;
}

interface LiveMiniRankingRowProps {
  position: number;
  previousPosition: number;
  user: { id: number; name: string; avatar: string };
  prediction: string | undefined;
  exactScore: { home: number; away: number } | undefined;
  confirmedPoints: number;
  livePoints: number;
  totalPoints: number;
  isCurrentUser: boolean;
  hasComodin: boolean;
}

export const LiveMiniRankingRow = memo(function LiveMiniRankingRow({
  position,
  previousPosition,
  user,
  prediction,
  exactScore,
  totalPoints,
  isCurrentUser,
  hasComodin,
}: LiveMiniRankingRowProps) {
  const diff = previousPosition - position;
  const bday = isBirthday(user.name);

  return (
    <div
      className={cn(
        "relative flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-500",
        hasComodin ? "bg-fifa-gold-light ring-1 ring-fifa-gold/30" : isCurrentUser ? "bg-fifa-blue/10 ring-1 ring-fifa-blue/20" : "bg-card-bg",
        bday && "birthday-row-mini !ring-0",
      )}
    >
      <div className="flex w-10 items-center gap-1">
        <span className="text-xs font-bold text-fifa-dark-gray">
          {position}
        </span>
        {diff !== 0 && (
          <span className={cn(
            "text-[10px] font-bold",
            diff > 0 ? "text-fifa-green" : "text-fifa-red",
          )}>
            {diff > 0 ? "▲" : "▼"}
          </span>
        )}
      </div>

      <AvatarDisplay avatar={user.avatar} size="sm" />

      <span className="flex-1 truncate text-xs font-medium text-foreground">
        {user.name}{bday && <span className="ml-1 birthday-bounce">🎂</span>}
      </span>

      <div className="flex items-center gap-1.5">
        {hasComodin && (
          <div className="relative h-4 w-4 flex-shrink-0 rounded-full overflow-hidden ring-1 ring-fifa-gold shadow-sm shadow-fifa-gold/30">
            <Image src="/images/comodin-fecha-1.jpg" alt="Comodín" fill className="object-cover" />
          </div>
        )}
        {exactScore ? (
          <span className={cn(
            "rounded-md px-2 py-0.5 text-[9px] font-bold text-white",
            getOutcomeBg(getLiveOutcome(exactScore.home, exactScore.away)),
          )}>
            {exactScore.home} - {exactScore.away}
          </span>
        ) : prediction ? (
          <span className={cn(
            "rounded-md px-1.5 py-0.5 text-[9px] font-semibold text-white",
            getOutcomeBg(prediction),
          )}>
            {getOutcomeLabel(prediction)}
          </span>
        ) : null}
      </div>

      <span className="text-sm font-bold text-foreground">{totalPoints}</span>
    </div>
  );
});
