"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Match, PlanillaOutcome } from "@/types";
import { getTeam } from "@/data/teams";
import { isMatchLocked } from "@/data/matches";
import { FlagImage } from "@/components/teams/FlagImage";
import { formatMatchDate, formatMatchTime, cn } from "@/lib/utils";
import { usePlanilla } from "@/context/PlanillaContext";

interface ExactScoresMap {
  [matchId: string]: { homeScore: number; awayScore: number };
}

interface PlanillaMatchRowProps {
  match: Match;
  fechaLocked?: boolean;
  doubleMatchId: string | null;
  comodinMatchId: string | null;
  comodinImage?: string;
  placementMode: boolean;
  comodinDragging?: boolean;
  comodinAllowed?: boolean;
  hasComodinRestrictions?: boolean;
  exactScoreEnabled?: boolean;
  exactScore?: { homeScore: number; awayScore: number };
  onExactScoreChange?: React.Dispatch<React.SetStateAction<ExactScoresMap>>;
  onComodinDrop: (matchId: string) => void;
  onComodinTouchDrop?: (matchId: string) => void;
  onComodinReject?: (message: string) => void;
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

export function PlanillaMatchRow({
  match,
  fechaLocked,
  doubleMatchId,
  comodinMatchId,
  onComodinDrop,
  onComodinTouchDrop,
  onComodinReject,
  onComodinRemove,
  onComodinDragStart,
  onComodinDragEnd,
  onDoubleAttemptOnComodin,
  placementMode,
  comodinDragging,
  comodinImage = "/images/comodino.JPG",
  comodinAllowed,
  hasComodinRestrictions,
  exactScoreEnabled,
  exactScore,
  onExactScoreChange,
}: PlanillaMatchRowProps) {
  const { predictions, setPrediction, removePrediction } = usePlanilla();
  const prediction = predictions[match.id];
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);

  const [matchLocked, setMatchLocked] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setMatchLocked(isMatchLocked(match));
    setDateStr(formatMatchDate(match.kickoff));
    setTimeStr(formatMatchTime(match.kickoff));
  }, [match]);

  const locked = matchLocked || (fechaLocked ?? false);

  const currentOutcome = prediction?.outcome;
  const isDouble = currentOutcome ? currentOutcome.length === 2 : false;
  const hasComodin = comodinMatchId === match.id;
  const canUseDouble = (doubleMatchId === null || doubleMatchId === match.id) && !hasComodin && !exactScoreEnabled;

  // Comodín restrictions: if admin set any, only allow on marked matches
  const canReceiveComodin = !hasComodinRestrictions || (comodinAllowed ?? false);

  // Touch drag for repositioning comodín from this match
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchMoved = useRef(false);

  const handleComodinTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchMoved.current = false;
  };

  const handleComodinTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    if (!touchMoved.current && Math.abs(dx) + Math.abs(dy) > 10) {
      touchMoved.current = true;
      setTouchDragging(true);
      onComodinDragStart();
    }
    if (touchMoved.current) {
      setTouchPos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleComodinTouchEnd = () => {
    if (!touchMoved.current) {
      onComodinRemove();
      return;
    }
    setTouchDragging(false);
    const el = document.elementFromPoint(touchPos.x, touchPos.y);
    const matchRow = el?.closest("[data-match-id]");
    if (matchRow && onComodinTouchDrop) {
      const targetId = matchRow.getAttribute("data-match-id");
      if (targetId && targetId !== match.id) {
        onComodinTouchDrop(targetId);
        return;
      }
    }
    onComodinDragEnd();
  };

  const [saving, setSaving] = useState(false);

  const handleClick = async (btn: "L" | "E" | "V") => {
    if (locked || saving) return;
    const wouldBeDouble = currentOutcome && currentOutcome.length === 1 && currentOutcome !== btn;
    if (wouldBeDouble && hasComodin) {
      onDoubleAttemptOnComodin();
    }
    const result = toggleOutcome(currentOutcome, btn, canUseDouble);
    setSaving(true);
    if (result === null) {
      await removePrediction(match.id);
    } else {
      await setPrediction(match.id, result);
    }
    setSaving(false);
  };

  const rejectMessages = [
    "¡Ese partido es muy fácil, elegí otro!",
    "¡No seas vivo! Buscá un partido más difícil",
    "¡Ahí no vale! Probá con otro partido",
    "¡Muy cantado ese resultado! Elegí otro",
  ];

  const rejectComodin = () => {
    if (onComodinReject) {
      const msg = rejectMessages[Math.floor(Math.random() * rejectMessages.length)];
      onComodinReject(msg);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (locked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (locked) return;
    if (e.dataTransfer.getData("text/plain") === "comodin") {
      if (canReceiveComodin) {
        onComodinDrop(match.id);
      } else {
        rejectComodin();
      }
    }
  };

  const handleRowClick = () => {
    if (!placementMode || locked) return;
    if (canReceiveComodin) {
      onComodinDrop(match.id);
    } else {
      rejectComodin();
    }
  };

  // Exact score handlers
  const [exactHome, setExactHome] = useState(exactScore?.homeScore?.toString() ?? "");
  const [exactAway, setExactAway] = useState(exactScore?.awayScore?.toString() ?? "");
  const [exactSaving, setExactSaving] = useState(false);

  useEffect(() => {
    setExactHome(exactScore?.homeScore?.toString() ?? "");
    setExactAway(exactScore?.awayScore?.toString() ?? "");
  }, [exactScore]);

  // Clear exact score when L/E/V is removed or changes to incompatible
  const prevOutcome = useRef(currentOutcome);
  useEffect(() => {
    if (prevOutcome.current === currentOutcome) return;
    prevOutcome.current = currentOutcome;

    const shouldClear = !currentOutcome || (exactHome !== "" && exactAway !== "" && (() => {
      const h = parseInt(exactHome, 10);
      const a = parseInt(exactAway, 10);
      if (isNaN(h) || isNaN(a)) return false;
      const implied = h > a ? "L" : h < a ? "V" : "E";
      return !currentOutcome.includes(implied);
    })());

    if (shouldClear && (exactHome !== "" || exactAway !== "" || exactScore)) {
      setExactHome("");
      setExactAway("");
      if (onExactScoreChange) {
        onExactScoreChange((prev) => {
          const next = { ...prev };
          delete next[match.id];
          return next;
        });
      }
      fetch("/api/exact-score", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id }),
      }).catch(() => {});
    }
  }, [currentOutcome, exactHome, exactAway, exactScore, match.id, onExactScoreChange]);

  const [exactRejectMsg, setExactRejectMsg] = useState<string | null>(null);
  const [exactHint, setExactHint] = useState(false);
  const exactHintShown = useRef(false);

  useEffect(() => {
    if (exactScoreEnabled && currentOutcome && !exactScore && !exactHintShown.current) {
      exactHintShown.current = true;
      setExactHint(true);
      setTimeout(() => setExactHint(false), 3000);
    }
  }, [exactScoreEnabled, currentOutcome, exactScore]);

  const rejectExactScore = () => {
    setExactHome("");
    setExactAway("");
    setExactRejectMsg("✗ El resultado no coincide con tu predicción");
    setTimeout(() => setExactRejectMsg(null), 2000);
  };

  // Auto-validate when both fields have values
  useEffect(() => {
    if (exactHome === "" || exactAway === "") return;
    const h = parseInt(exactHome, 10);
    const a = parseInt(exactAway, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    if (!currentOutcome) return;
    const implied = h > a ? "L" : h < a ? "V" : "E";
    if (!currentOutcome.includes(implied)) {
      rejectExactScore();
    }
  }, [exactHome, exactAway, currentOutcome]);

  const handleExactScoreSave = async () => {
    const h = parseInt(exactHome, 10);
    const a = parseInt(exactAway, 10);

    if (exactHome === "" || exactAway === "" || isNaN(h) || isNaN(a)) return;

    if (h < 0 || a < 0) return;
    if (!currentOutcome) return;

    const implied = h > a ? "L" : h < a ? "V" : "E";
    if (!currentOutcome.includes(implied)) {
      rejectExactScore();
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

  return (
    <div
      data-match-id={match.id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleRowClick}
      className={cn(
        "relative flex items-center gap-2 rounded-xl bg-card-bg px-3 py-2.5 ring-1 transition-all",
        exactScoreEnabled && currentOutcome && "mb-10",
        locked && "opacity-50",
        hasComodin
          ? "ring-fifa-gold/50 bg-fifa-gold/5"
          : dragOver
            ? canReceiveComodin
              ? "ring-fifa-gold/40 bg-fifa-gold/10 scale-[1.02]"
              : "ring-fifa-red/40 bg-fifa-red/5 scale-[1.01]"
            : (placementMode || comodinDragging) && !locked
              ? canReceiveComodin
                ? "ring-fifa-gold/20 cursor-pointer hover:ring-fifa-gold/40 hover:bg-fifa-gold/5"
                : "ring-white/5 cursor-not-allowed opacity-30 hover:ring-fifa-red/30 hover:bg-fifa-red/5"
              : exactScore
                ? "ring-fifa-gold/30 bg-fifa-gold/[0.03]"
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
          onDragEnd={() => {
            onComodinDragEnd();
          }}
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
          <Image
            src={comodinImage}
            alt="Comodín"
            fill
            className="object-cover pointer-events-none"
          />
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
        <FlagImage code={homeTeam.flagCode} name={homeTeam.name} size="sm" />
        <span className="font-display text-base tracking-wider text-foreground truncate">
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
              "flex h-10 w-10 items-center justify-center rounded-lg font-display text-base tracking-wider transition-all",
              isSelected(currentOutcome, o)
                ? o === "L"
                  ? "bg-outcome-local text-white shadow-lg shadow-outcome-local/20"
                  : o === "E"
                    ? "bg-outcome-empate text-white shadow-lg shadow-outcome-empate/20"
                    : "bg-outcome-visitante text-white shadow-lg shadow-outcome-visitante/20"
                : "bg-surface text-fifa-dark-gray hover:bg-white/10",
            )}
          >
            {o}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="font-display text-base tracking-wider text-foreground truncate text-right">
          {awayTeam.shortName}
        </span>
        <FlagImage code={awayTeam.flagCode} name={awayTeam.name} size="sm" />
      </div>

      {isDouble && !exactScoreEnabled && (
        <span className="absolute -right-1 -top-1 rounded-full bg-fifa-purple px-1.5 py-0.5 text-[8px] font-bold text-white shadow-lg shadow-fifa-purple/30">
          DOBLE
        </span>
      )}

      {exactScoreEnabled && (
        <span className="absolute -right-1 -top-1 rounded-full bg-fifa-gold px-1.5 py-0.5 text-[8px] font-bold text-black shadow-lg shadow-fifa-gold/30">
          EXACTO
        </span>
      )}

      {hasComodin && (
        <span className="absolute -right-1 -bottom-1 rounded-full bg-fifa-gold px-1.5 py-0.5 text-[8px] font-bold text-black shadow-lg shadow-fifa-gold/30">
          +2
        </span>
      )}

      <div className="hidden sm:block flex-shrink-0 text-right">
        <span className="text-[10px] text-fifa-dark-gray/50">
          {dateStr && timeStr ? `${dateStr}` : ""}
        </span>
      </div>

      {exactScoreEnabled && currentOutcome && (
        <div className="absolute -bottom-[1rem] left-1/2 -translate-x-[4.5rem] w-[1.3rem] h-[1rem] border-l border-b border-white/15 rounded-bl-md" />
      )}

      {exactScoreEnabled && currentOutcome && (
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
                if (exactHome === "" || exactAway === "") {
                  setExactHome("");
                  setExactAway("");
                  if (exactScore && onExactScoreChange) {
                    onExactScoreChange((prev) => { const next = { ...prev }; delete next[match.id]; return next; });
                    fetch("/api/exact-score", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: match.id }) }).catch(() => {});
                  }
                }
              }
            }}
            disabled={locked || exactSaving}
            placeholder="—"
            aria-label={`Goles ${getTeam(match.homeTeamId).shortName}`}
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
                if (exactHome === "" || exactAway === "") {
                  setExactHome("");
                  setExactAway("");
                  if (exactScore && onExactScoreChange) {
                    onExactScoreChange((prev) => { const next = { ...prev }; delete next[match.id]; return next; });
                    fetch("/api/exact-score", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: match.id }) }).catch(() => {});
                  }
                }
              }
            }}
            disabled={locked || exactSaving}
            placeholder="—"
            aria-label={`Goles ${getTeam(match.awayTeamId).shortName}`}
            className="w-8 rounded bg-card-bg px-1 py-0.5 text-center text-xs text-foreground outline-none ring-1 ring-white/10 focus:ring-fifa-gold/40 placeholder:text-fifa-dark-gray/30"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {exactScore && (
        <span className="absolute -right-1 -bottom-1 rounded-full bg-fifa-gold px-1.5 py-0.5 text-[8px] font-bold text-black shadow-lg shadow-fifa-gold/30">
          +2
        </span>
      )}

      {exactRejectMsg && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-[4.5rem] z-50 rounded-lg bg-fifa-red/90 px-3 py-1 text-[10px] font-medium text-white shadow-lg whitespace-nowrap">
          {exactRejectMsg}
        </div>
      )}

      {exactHint && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-[4.5rem] z-50 rounded-lg bg-fifa-gold px-2.5 py-1 text-[9px] font-medium text-black shadow-lg whitespace-nowrap animate-[fadeInUp_0.2s_ease-out]">
          Adiviná el resultado exacto · +2 pts
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-fifa-gold" />
        </div>
      )}
    </div>
  );
}
