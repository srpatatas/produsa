"use client";

import { useState, useEffect } from "react";
import { Match, PlanillaOutcome } from "@/types";
import { getTeam } from "@/data/teams";
import { isMatchLocked } from "@/data/matches";
import { FlagImage } from "@/components/teams/FlagImage";
import { formatMatchDate, formatMatchTime, cn } from "@/lib/utils";
import { usePlanilla } from "@/context/PlanillaContext";

interface PlanillaMatchRowProps {
  match: Match;
  hasDouble: boolean;
  onDoubleUsed: () => void;
}

const outcomes: ("L" | "E" | "V")[] = ["L", "E", "V"];

function isSelected(current: PlanillaOutcome | undefined, btn: "L" | "E" | "V"): boolean {
  if (!current) return false;
  return current.includes(btn);
}

function toggleOutcome(
  current: PlanillaOutcome | undefined,
  btn: "L" | "E" | "V",
  canDouble: boolean,
): PlanillaOutcome | null {
  if (!current) return btn;
  if (current === btn) return null; // deselect
  if (current.length === 1) {
    if (canDouble) {
      const pair = [current, btn].sort().join("") as PlanillaOutcome;
      return pair;
    }
    return btn; // replace single
  }
  // Current is double
  if (current.includes(btn)) {
    // Remove this one from double → single
    return current.replace(btn, "") as PlanillaOutcome;
  }
  return btn; // replace double with single
}

export function PlanillaMatchRow({ match, hasDouble, onDoubleUsed }: PlanillaMatchRowProps) {
  const { predictions, setPrediction, removePrediction } = usePlanilla();
  const prediction = predictions[match.id];
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);

  const [locked, setLocked] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    setLocked(isMatchLocked(match));
    setDateStr(formatMatchDate(match.kickoff));
    setTimeStr(formatMatchTime(match.kickoff));
  }, [match]);

  const currentOutcome = prediction?.outcome;
  const isDouble = currentOutcome ? currentOutcome.length === 2 : false;
  const canUseDouble = !hasDouble || isDouble;

  const handleClick = (btn: "L" | "E" | "V") => {
    if (locked) return;
    const result = toggleOutcome(currentOutcome, btn, canUseDouble);
    if (result === null) {
      removePrediction(match.id);
    } else {
      setPrediction(match.id, result);
      if (result.length === 2) onDoubleUsed();
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-xl bg-card-bg px-3 py-2.5 ring-1 ring-white/5 transition-all",
      locked && "opacity-50",
      isDouble && "ring-fifa-purple/30",
    )}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FlagImage code={homeTeam.flagCode} name={homeTeam.name} size="sm" />
        <span className="font-display text-xs tracking-wider text-foreground truncate">
          {homeTeam.shortName}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {outcomes.map((o) => (
          <button
            key={o}
            type="button"
            disabled={locked}
            onClick={() => handleClick(o)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg font-display text-xs tracking-wider transition-all",
              isSelected(currentOutcome, o)
                ? o === "L"
                  ? "bg-fifa-green text-white shadow-lg shadow-fifa-green/20"
                  : o === "E"
                    ? "bg-fifa-blue text-white shadow-lg shadow-fifa-blue/20"
                    : "bg-fifa-red text-white shadow-lg shadow-fifa-red/20"
                : "bg-surface text-fifa-dark-gray hover:bg-white/10",
            )}
          >
            {o}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="font-display text-xs tracking-wider text-foreground truncate text-right">
          {awayTeam.shortName}
        </span>
        <FlagImage code={awayTeam.flagCode} name={awayTeam.name} size="sm" />
      </div>

      {isDouble && (
        <span className="flex-shrink-0 rounded-full bg-fifa-purple/20 px-2 py-0.5 text-[9px] font-semibold text-fifa-purple">
          DOBLE
        </span>
      )}

      <div className="hidden sm:block flex-shrink-0 text-right">
        <span className="text-[10px] text-fifa-dark-gray/50">
          {dateStr && timeStr ? `${dateStr}` : ""}
        </span>
      </div>
    </div>
  );
}
