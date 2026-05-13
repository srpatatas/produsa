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
  featured?: boolean;
  comodinMatchId: string | null;
  comodinEmoji: string;
  comodinImage: string | null;
  placementMode: boolean;
  onComodinDrop: (matchId: string) => void;
  onComodinRemove: () => void;
  onComodinDragStart: () => void;
  onComodinDragEnd: () => void;
}

const outcomes: ("L" | "V")[] = ["L", "V"];

export function KnockoutPlanillaMatchRow({
  match,
  featured = false,
  comodinMatchId,
  comodinEmoji,
  comodinImage,
  placementMode,
  onComodinDrop,
  onComodinRemove,
  onComodinDragStart,
  onComodinDragEnd,
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
  const hasComodin = comodinMatchId === match.id;
  const disabled = locked || !predictable;

  const [saving, setSaving] = useState(false);

  const handleClick = async (btn: "L" | "V") => {
    if (disabled || saving) return;
    setSaving(true);
    if (currentOutcome === btn) {
      await removePrediction(match.id);
    } else {
      await setPrediction(match.id, btn as PlanillaOutcome);
    }
    setSaving(false);
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
        "relative flex items-center gap-2 rounded-xl bg-card-bg ring-1 transition-all",
        featured ? "px-4 py-4" : "px-3 py-2.5",
        featured && !hasComodin && !dragOver && "ring-fifa-gold/30 bg-fifa-gold/[0.03] shadow-lg shadow-fifa-gold/10",
        hasComodin
          ? "ring-fifa-gold/50 bg-fifa-gold/5"
          : dragOver
            ? "ring-fifa-gold/40 bg-fifa-gold/10 scale-[1.02]"
            : placementMode && !disabled
              ? "ring-fifa-gold/20 cursor-pointer hover:ring-fifa-gold/40 hover:bg-fifa-gold/5"
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
          {comodinImage ? (
            <Image src={comodinImage} alt="Comodín" fill className="object-cover pointer-events-none" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-fifa-gold/20 text-lg">
              {comodinEmoji}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {homeTeam ? (
          <>
            <FlagImage code={homeTeam.flagCode} name={homeTeam.name} size={featured ? "md" : "sm"} />
            <span className={cn(
              "font-display tracking-wider text-foreground truncate",
              featured ? "text-lg" : "text-base",
            )}>
              {homeTeam.shortName}
            </span>
          </>
        ) : (
          <span className="text-sm text-fifa-dark-gray/70 truncate">
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
              cn("flex items-center justify-center rounded-lg font-display tracking-wider transition-all",
                featured ? "h-12 w-12 text-lg" : "h-10 w-10 text-base"),
              currentOutcome === o
                ? o === "L"
                  ? "bg-fifa-green text-white shadow-lg shadow-fifa-green/20"
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
            <span className={cn(
              "font-display tracking-wider text-foreground truncate text-right",
              featured ? "text-lg" : "text-base",
            )}>
              {awayTeam.shortName}
            </span>
            <FlagImage code={awayTeam.flagCode} name={awayTeam.name} size={featured ? "md" : "sm"} />
          </>
        ) : (
          <span className="text-sm text-fifa-dark-gray/70 truncate text-right">
            {match.awaySlot.label}
          </span>
        )}
      </div>

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
