"use client";

import { cn } from "@/lib/utils";
import { FlagImage } from "@/components/teams/FlagImage";
import { getTeam } from "@/data/teams";

interface PenaltyPickerProps {
  homeTeamId: string;
  awayTeamId: string;
  selected: "home" | "away" | undefined;
  onChange: (winner: "home" | "away") => void;
}

export function PenaltyPicker({
  homeTeamId,
  awayTeamId,
  selected,
  onChange,
}: PenaltyPickerProps) {
  const home = getTeam(homeTeamId);
  const away = getTeam(awayTeamId);

  return (
    <div className="mt-3 flex flex-col items-center gap-2">
      <span className="text-[10px] text-fifa-dark-gray">
        Empate — ¿quién avanza por penales?
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("home")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all ring-1",
            selected === "home"
              ? "bg-fifa-purple/20 text-foreground ring-fifa-purple/40"
              : "bg-surface text-fifa-dark-gray ring-white/5 hover:ring-white/15",
          )}
        >
          <FlagImage code={home.flagCode} name={home.name} size="sm" />
          <span className="font-display tracking-wider">{home.shortName}</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("away")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all ring-1",
            selected === "away"
              ? "bg-fifa-purple/20 text-foreground ring-fifa-purple/40"
              : "bg-surface text-fifa-dark-gray ring-white/5 hover:ring-white/15",
          )}
        >
          <FlagImage code={away.flagCode} name={away.name} size="sm" />
          <span className="font-display tracking-wider">{away.shortName}</span>
        </button>
      </div>
    </div>
  );
}
