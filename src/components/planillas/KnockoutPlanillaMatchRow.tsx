"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { KnockoutMatch, PlanillaOutcome } from "@/types";
import { getTeam } from "@/data/teams";
import { isKnockoutMatchLocked } from "@/data/knockoutMatches";
import { resolveKnockoutMatch, isKnockoutMatchPredictable } from "@/lib/knockoutResolver";
import { FlagImage } from "@/components/teams/FlagImage";
import { formatMatchDate, cn } from "@/lib/utils";
import { usePlanilla } from "@/context/PlanillaContext";

interface KnockoutPlanillaMatchRowProps {
  match: KnockoutMatch;
  doubleMatchId: string | null;
  comodinMatchId: string | null;
  placementMode: boolean;
  onComodinDrop: (matchId: string) => void;
  onComodinRemove: () => void;
  onComodinDragStart: () => void;
  onComodinDragEnd: () => void;
  onDoubleAttemptOnComodin: () => void;
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
  if (current === btn) return null;
  if (current.length === 1) {
    if (canDouble) {
      const pair = [current, btn].sort().join("") as PlanillaOutcome;
      return pair;
    }
    return btn;
  }
  if (current.includes(btn)) {
    return current.replace(btn, "") as PlanillaOutcome;
  }
  return btn;
}

export function KnockoutPlanillaMatchRow({
  match,
  doubleMatchId,
  comodinMatchId,
  placementMode,
  onComodinDrop,
  onComodinRemove,
  onComodinDragStart,
  onComodinDragEnd,
  onDoubleAttemptOnComodin,
}: KnockoutPlanillaMatchRowProps) {
  const { predictions, setPrediction, removePrediction } = usePlanilla();
  const prediction = predictions[match.id];

  const resolved = resolveKnockoutMatch(match);
  const predictable = isKnockoutMatchPredictable(match);
  const homeTeam = resolved.homeTeamId ? getTeam(resolved.homeTeamId) : null;
  const awayTeam = resolved.awayTeamId ? getTeam(resolved.awayTeamId) : null;

  const [locked, setLocked] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setLocked(isKnockoutMatchLocked(match));
    setDateStr(formatMatchDate(match.kickoff));
  }, [match]);

  const currentOutcome = prediction?.outcome;
  const isDouble = currentOutcome ? currentOutcome.length === 2 : false;
  const hasComodin = comodinMatchId === match.id;
  const canUseDouble = (doubleMatchId === null || doubleMatchId === match.id) && !hasComodin;
  const disabled = locked || !predictable;

  const handleClick = (btn: "L" | "E" | "V") => {
    if (disabled) return;
    const wouldBeDouble = currentOutcome && currentOutcome.length === 1 && currentOutcome !== btn;
    if (wouldBeDouble && hasComodin) onDoubleAttemptOnComodin();
    const result = toggleOutcome(currentOutcome, btn, canUseDouble);
    if (result === null) {
      removePrediction(match.id);
    } else {
      setPrediction(match.id, result);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.getData("text/plain") === "comodin") onComodinDrop(match.id);
  };

  const handleRowClick = () => {
    if (!placementMode || disabled) return;
    onComodinDrop(match.id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleRowClick}
      className={cn(
        "relative flex items-center gap-2 rounded-xl bg-card-bg px-3 py-2.5 ring-1 transition-all",
        disabled && "opacity-40",
        hasComodin
          ? "ring-fifa-gold/50 bg-fifa-gold/5"
          : dragOver
            ? "ring-fifa-gold/40 bg-fifa-gold/10 scale-[1.02]"
            : placementMode && !disabled
              ? "ring-fifa-gold/20 cursor-pointer hover:ring-fifa-gold/40 hover:bg-fifa-gold/5"
              : isDouble
                ? "ring-fifa-purple/30 ring-white/5"
                : "ring-white/5",
      )}
    >
      {hasComodin && (
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "comodin");
            e.dataTransfer.effectAllowed = "move";
            onComodinDragStart();
          }}
          onDragEnd={() => onComodinDragEnd()}
          title="Arrastrá a otro partido o hacé click para quitar"
          onClick={onComodinRemove}
          className="absolute -left-2 -top-2 z-10 h-8 w-8 rounded-full overflow-hidden ring-2 ring-fifa-gold cursor-grab active:cursor-grabbing hover:scale-110 transition-transform shadow-lg shadow-fifa-gold/20"
        >
          <Image src="/images/comodino.JPG" alt="Comodín" fill className="object-cover pointer-events-none" />
        </div>
      )}

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {homeTeam ? (
          <>
            <FlagImage code={homeTeam.flagCode} name={homeTeam.name} size="sm" />
            <span className="font-display text-sm tracking-wider text-foreground truncate">
              {homeTeam.shortName}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-fifa-dark-gray/40 truncate">
            {match.homeSlot.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {outcomes.map((o) => (
          <button
            key={o}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(o)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg font-display text-sm tracking-wider transition-all",
              isSelected(currentOutcome, o)
                ? o === "L"
                  ? "bg-fifa-green text-white shadow-lg shadow-fifa-green/20"
                  : o === "E"
                    ? "bg-fifa-blue text-white shadow-lg shadow-fifa-blue/20"
                    : "bg-fifa-red text-white shadow-lg shadow-fifa-red/20"
                : disabled
                  ? "bg-surface/50 text-fifa-dark-gray/30"
                  : "bg-surface text-fifa-dark-gray hover:bg-white/10",
            )}
          >
            {o}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        {awayTeam ? (
          <>
            <span className="font-display text-sm tracking-wider text-foreground truncate text-right">
              {awayTeam.shortName}
            </span>
            <FlagImage code={awayTeam.flagCode} name={awayTeam.name} size="sm" />
          </>
        ) : (
          <span className="text-[10px] text-fifa-dark-gray/40 truncate text-right">
            {match.awaySlot.label}
          </span>
        )}
      </div>

      {isDouble && (
        <span className="absolute -right-1 -top-1 rounded-full bg-fifa-purple px-1.5 py-0.5 text-[8px] font-bold text-white shadow-lg shadow-fifa-purple/30">
          DOBLE
        </span>
      )}

      {hasComodin && (
        <span className="absolute -right-1 -bottom-1 rounded-full bg-fifa-gold px-1.5 py-0.5 text-[8px] font-bold text-black shadow-lg shadow-fifa-gold/30">
          +2
        </span>
      )}

      <div className="hidden sm:block flex-shrink-0 text-right">
        <span className="text-[10px] text-fifa-dark-gray/50">{dateStr}</span>
      </div>
    </div>
  );
}
