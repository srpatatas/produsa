"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { KnockoutMatch, PlanillaOutcome } from "@/types";
import { getTeam } from "@/data/teams";
import { isKnockoutMatchLocked } from "@/data/knockoutMatches";
import { FlagImage } from "@/components/teams/FlagImage";
import { formatMatchDate, cn } from "@/lib/utils";
import { usePlanilla } from "@/context/PlanillaContext";

interface ExactScoresMap {
  [matchId: string]: { homeScore: number; awayScore: number };
}

interface KnockoutPlanillaMatchRowProps {
  match: KnockoutMatch;
  resolvedHomeTeamId: string | null;
  resolvedAwayTeamId: string | null;
  predictable: boolean;
  featured?: boolean;
  roundLocked?: boolean;
  comodinMatchId: string | null;
  comodinImage?: string;
  placementMode: boolean;
  comodinDragging?: boolean;
  comodinAllowed?: boolean;
  hasComodinRestrictions?: boolean;
  exactScore?: { homeScore: number; awayScore: number };
  onExactScoreChange?: React.Dispatch<React.SetStateAction<ExactScoresMap>>;
  onComodinDrop: (matchId: string) => void;
  onComodinTouchDrop?: (matchId: string) => void;
  onComodinReject?: (message: string) => void;
  onComodinRemove: () => void;
  onComodinDragStart: () => void;
  onComodinDragEnd: () => void;
}

const outcomes: ("L" | "V")[] = ["L", "V"];


export function KnockoutPlanillaMatchRow({
  match,
  resolvedHomeTeamId,
  resolvedAwayTeamId,
  predictable,
  featured = false,
  roundLocked,
  comodinMatchId,
  comodinImage = "/images/comodino.JPG",
  placementMode,
  comodinDragging,
  comodinAllowed,
  hasComodinRestrictions,
  exactScore,
  onExactScoreChange,
  onComodinDrop,
  onComodinTouchDrop,
  onComodinReject,
  onComodinRemove,
  onComodinDragStart,
  onComodinDragEnd,
}: KnockoutPlanillaMatchRowProps) {
  const { predictions, setPrediction, removePrediction } = usePlanilla();
  const prediction = predictions[match.id];

  const homeTeam = resolvedHomeTeamId ? getTeam(resolvedHomeTeamId) : null;
  const awayTeam = resolvedAwayTeamId ? getTeam(resolvedAwayTeamId) : null;

  const [matchLocked, setMatchLocked] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setMatchLocked(isKnockoutMatchLocked(match));
    setDateStr(formatMatchDate(match.kickoff));
  }, [match]);

  const locked = matchLocked || (roundLocked ?? false);
  const currentOutcome = prediction?.outcome;
  const hasComodin = comodinMatchId === match.id;
  const disabled = locked || !predictable;

  const canReceiveComodin = !hasComodinRestrictions || (comodinAllowed ?? false);

  const [touchDragging, setTouchDragging] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchMoved = useRef(false);

  useEffect(() => {
    if (!touchDragging) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, [touchDragging]);

  const handleComodinTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchMoved.current = false;
  };
  const handleComodinTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touchMoved.current && Math.abs(touch.clientX - touchStartPos.current.x) + Math.abs(touch.clientY - touchStartPos.current.y) > 10) {
      touchMoved.current = true;
      setTouchDragging(true);
      onComodinDragStart();
    }
    if (touchMoved.current) {
      e.preventDefault();
      setTouchPos({ x: touch.clientX, y: touch.clientY });
    }
  };
  const handleComodinTouchEnd = () => {
    if (!touchMoved.current) { onComodinRemove(); return; }
    setTouchDragging(false);
    const el = document.elementFromPoint(touchPos.x, touchPos.y);
    const matchRow = el?.closest("[data-match-id]");
    if (matchRow && onComodinTouchDrop) {
      const targetId = matchRow.getAttribute("data-match-id");
      if (targetId && targetId !== match.id) { onComodinTouchDrop(targetId); return; }
    }
    onComodinDragEnd();
  };

  const [saving, setSaving] = useState(false);

  // Exact score — always enabled for knockout, draws allowed (goes to pens)
  const [exactHome, setExactHome] = useState(exactScore?.homeScore?.toString() ?? "");
  const [exactAway, setExactAway] = useState(exactScore?.awayScore?.toString() ?? "");
  const [exactSaving, setExactSaving] = useState(false);

  useEffect(() => {
    setExactHome(exactScore?.homeScore?.toString() ?? "");
    setExactAway(exactScore?.awayScore?.toString() ?? "");
  }, [exactScore]);

  const isExactScoreValid = (h: number, a: number): boolean => {
    if (!currentOutcome) return false;
    if (h === a) return true; // draw = goes to pens, always valid
    const implied = h > a ? "L" : "V";
    return currentOutcome.includes(implied);
  };

  const handleExactScoreSave = async () => {
    const h = parseInt(exactHome, 10);
    const a = parseInt(exactAway, 10);
    if (exactHome === "" || exactAway === "" || isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    if (!currentOutcome) return;
    if (!isExactScoreValid(h, a)) {
      setExactHome("");
      setExactAway("");
      return;
    }
    setExactSaving(true);
    try {
      const res = await fetch("/api/exact-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeScore: h, awayScore: a }),
      });
      if (res.ok && onExactScoreChange) {
        onExactScoreChange((prev) => ({ ...prev, [match.id]: { homeScore: h, awayScore: a } }));
      }
    } catch {}
    setExactSaving(false);
  };

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

  const rejectComodin = () => {
    if (onComodinReject) {
      onComodinReject("");
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
    if (e.dataTransfer.getData("text/plain") === "comodin") {
      if (canReceiveComodin) {
        onComodinDrop(match.id);
      } else {
        rejectComodin();
      }
    }
  };

  const handleRowClick = () => {
    if (!placementMode || disabled) return;
    if (canReceiveComodin) {
      onComodinDrop(match.id);
    } else {
      rejectComodin();
    }
  };

  return (
    <div
      data-match-id={match.id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleRowClick}
      className={cn(
        "relative flex items-center gap-2 rounded-xl bg-card-bg ring-1 transition-all",
        predictable && currentOutcome && "mb-10",
        featured ? "px-4 py-4" : "px-3 py-2.5",
        featured && !hasComodin && !dragOver && "ring-fifa-gold/30 bg-fifa-gold/[0.03] shadow-lg shadow-fifa-gold/10",
        hasComodin
          ? "ring-fifa-gold/50 bg-fifa-gold/5"
          : dragOver
            ? canReceiveComodin
              ? "ring-fifa-gold/40 bg-fifa-gold/10 scale-[1.02]"
              : "ring-fifa-red/40 bg-fifa-red/5 scale-[1.01]"
            : (placementMode || comodinDragging) && !disabled
              ? canReceiveComodin
                ? "ring-fifa-gold/20 cursor-pointer hover:ring-fifa-gold/40 hover:bg-fifa-gold/5"
                : "ring-white/5 cursor-not-allowed opacity-30 hover:ring-fifa-red/30 hover:bg-fifa-red/5"
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
          onTouchStart={handleComodinTouchStart}
          onTouchMove={handleComodinTouchMove}
          onTouchEnd={handleComodinTouchEnd}
          title="Arrastrá a otro partido o hacé click para quitar"
          onClick={onComodinRemove}
          className={cn(
            "absolute -left-2 -top-2 z-10 h-8 w-8 rounded-full overflow-hidden ring-2 ring-fifa-gold cursor-grab active:cursor-grabbing hover:scale-110 transition-transform shadow-lg shadow-fifa-gold/20 touch-none",
            touchDragging && "opacity-30",
          )}
        >
          <Image src={comodinImage} alt="Comodín" fill className="object-cover pointer-events-none" />
        </div>
      )}

      {touchDragging && (
        <div
          className="fixed z-[100] h-10 w-10 rounded-full overflow-hidden ring-2 ring-fifa-gold shadow-2xl shadow-fifa-gold/40 pointer-events-none"
          style={{ left: touchPos.x - 20, top: touchPos.y - 20 }}
        >
          <Image src={comodinImage} alt="Comodín" fill className="object-cover" />
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
                  ? "bg-outcome-local text-white shadow-lg shadow-outcome-local/20"
                  : "bg-outcome-visitante text-white shadow-lg shadow-outcome-visitante/20"
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

      {predictable && currentOutcome && (
        <div className="absolute -bottom-[1rem] left-1/2 -translate-x-[4.5rem] w-[1.3rem] h-[1rem] border-l border-b border-white/15 rounded-bl-md" />
      )}

      {predictable && currentOutcome && (
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 -bottom-8 flex items-center justify-center gap-1.5 rounded-full px-3 py-1 ring-1 animate-[slideDown_0.2s_ease-out]",
          exactScore ? "bg-fifa-gold/10 ring-fifa-gold/20" : "bg-surface ring-white/5",
        )}>
          <input
            type="number"
            min={0}
            max={20}
            value={exactHome}
            onChange={(e) => setExactHome(e.target.value)}
            onBlur={handleExactScoreSave}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            disabled={disabled || exactSaving}
            placeholder="—"
            className="w-8 rounded bg-card-bg px-1 py-0.5 text-center text-xs text-foreground outline-none ring-1 ring-white/10 focus:ring-fifa-gold/40 placeholder:text-fifa-dark-gray/30"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-[9px] text-fifa-dark-gray">:</span>
          <input
            type="number"
            min={0}
            max={20}
            value={exactAway}
            onChange={(e) => setExactAway(e.target.value)}
            onBlur={handleExactScoreSave}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            disabled={disabled || exactSaving}
            placeholder="—"
            className="w-8 rounded bg-card-bg px-1 py-0.5 text-center text-xs text-foreground outline-none ring-1 ring-white/10 focus:ring-fifa-gold/40 placeholder:text-fifa-dark-gray/30"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
