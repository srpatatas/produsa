"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { knockoutMatches } from "@/data/knockoutMatches";
import { KnockoutMatch } from "@/types";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { cn } from "@/lib/utils";

interface ResolvedMatch { id: string; homeTeamId: string | null; awayTeamId: string | null; }
interface MatchResult { homeScore: number; awayScore: number; homePenalty?: number | null; awayPenalty?: number | null; }

function MatchBox({ matchId, resolvedMap, resultMap, userPredictions, colWidth, size = "sm" }: {
  matchId: string; resolvedMap: Record<string, ResolvedMatch>; resultMap: Record<string, MatchResult>; userPredictions: Record<string, string>; colWidth: number; size?: "sm" | "md" | "lg";
}) {
  const match = knockoutMatches.find((m) => m.id === matchId);
  if (!match) return null;
  const resolved = resolvedMap[matchId];
  const result = resultMap[matchId];
  const isFinished = !!result;
  const hasPen = result?.homePenalty != null && result?.awayPenalty != null;
  const homeWins = isFinished && (hasPen ? result.homePenalty! > result.awayPenalty! : result.homeScore > result.awayScore);
  const awayWins = isFinished && (hasPen ? result.awayPenalty! > result.homePenalty! : result.awayScore > result.homeScore);

  const boxW = size === "lg" ? colWidth * 0.85 : size === "md" ? colWidth * 0.8 : colWidth * 0.75;
  const py = size === "lg" ? "py-2" : "py-1.5";
  const flagSize = "sm" as const;
  const textSize = size === "lg" ? "text-xs" : "text-[11px]";
  const scoreSize = size === "lg" ? "text-sm" : "text-xs";

  function Row({ teamId, label, score, penalty, isW, isL }: { teamId: string | null; label: string; score?: number; penalty?: number | null; isW?: boolean; isL?: boolean; }) {
    const team = teamId ? getTeam(teamId) : null;
    return (
      <div className={cn("flex items-center gap-1 px-1.5", py, isL && "opacity-40")}>
        {team ? <span className="flex-shrink-0"><FlagImage code={team.flagCode} name={team.name} size={flagSize} /></span> : <div className="h-4 w-5 flex-shrink-0 rounded-[2px] bg-white/10 flex items-center justify-center text-[9px] text-white/40">?</div>}
        <span className={cn("flex-1 font-display tracking-wider truncate", textSize, team ? "text-foreground" : "text-white/40", isW && "text-fifa-gold")}>{team?.shortName ?? ""}</span>
        {penalty != null && <span className="text-[7px] text-white/50 flex-shrink-0">({penalty})</span>}
        {score != null && <span className={cn(scoreSize, "font-bold flex-shrink-0", isW ? "text-foreground" : "text-white/50")}>{score}</span>}
      </div>
    );
  }

  const userPred = userPredictions[matchId];
  const actual = isFinished ? (hasPen ? (result.homePenalty! > result.awayPenalty! ? "L" : "V") : (result.homeScore > result.awayScore ? "L" : result.awayScore > result.homeScore ? "V" : "E")) : null;
  const gotItRight = actual && userPred ? userPred.includes(actual) : null;

  let statusLabel: string;
  let statusColor: string;
  if (isFinished && userPred) {
    statusLabel = gotItRight ? "Acertaste" : "Fallaste";
    statusColor = gotItRight ? "text-fifa-green" : "text-fifa-red";
  } else if (isFinished && !userPred) {
    statusLabel = "Sin predicción";
    statusColor = "text-white/40";
  } else {
    statusLabel = new Date(match.kickoff).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }) + " · " + new Date(match.kickoff).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }) + "h";
    statusColor = "text-white/80";
  }

  return (
    <div className="flex flex-col items-center">
      <div className={cn("rounded-md ring-1 overflow-hidden", isFinished ? "ring-white/15 bg-white/[0.04]" : "ring-white/5 bg-white/[0.02]")} style={{ width: boxW }}>
        <Row teamId={resolved?.homeTeamId ?? null} label={match.homeSlot.label} score={isFinished ? result.homeScore : undefined} penalty={hasPen ? result.homePenalty : undefined} isW={homeWins} isL={awayWins} />
        <div className="h-px bg-white/5" />
        <Row teamId={resolved?.awayTeamId ?? null} label={match.awaySlot.label} score={isFinished ? result.awayScore : undefined} penalty={hasPen ? result.awayPenalty : undefined} isW={awayWins} isL={homeWins} />
      </div>
      <span className={cn("text-[9px] mt-0.5 font-medium uppercase", statusColor)}>{statusLabel}</span>
    </div>
  );
}

// Layout: positions as [col, row] where col 0-8 (left to right), row 0-15 (top to bottom)
// Left side: cols 0,1,2,3 | Right side: cols 8,7,6,5 | Center: col 4
const POSITIONS: Record<string, [number, number]> = {
  // Left R32 (col 0)
  "R32-3": [0, 0], "R32-6": [0, 1], "R32-1": [0, 2], "R32-4": [0, 3],
  "R32-12": [0, 5.5], "R32-11": [0, 6.5], "R32-10": [0, 7.5], "R32-9": [0, 8.5],
  // Left R16 (col 1)
  "R16-1": [1, 0.5], "R16-2": [1, 2.5], "R16-3": [1, 6], "R16-4": [1, 8],
  // Left QF (col 2)
  "QF-1": [2, 1.5], "QF-2": [2, 7],
  // Left SF (col 3)
  "SF-1": [3, 3],
  // Right R32 (col 8)
  "R32-2": [8, 0], "R32-5": [8, 1], "R32-7": [8, 2], "R32-8": [8, 3],
  "R32-15": [8, 5.5], "R32-14": [8, 6.5], "R32-13": [8, 7.5], "R32-16": [8, 8.5],
  // Right R16 (col 7)
  "R16-5": [7, 0.5], "R16-6": [7, 2.5], "R16-7": [7, 6], "R16-8": [7, 8],
  // Right QF (col 6)
  "QF-3": [6, 1.5], "QF-4": [6, 7],
  // Right SF (col 5)
  "SF-2": [5, 3],
  // Final (col 4)
  "F": [4, 4.2],
  // 3P (col 4)
  "3P": [4, 7],
};

const TOTAL_COLS = 9;
const TOTAL_ROWS = 10;
const Y_OFFSET = 30;

export function BracketView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(0);
  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolvedMatch>>({});
  const [resultMap, setResultMap] = useState<Record<string, MatchResult>>({});
  const [userPredictions, setUserPredictions] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setColWidth(Math.max(110, Math.floor(w / TOTAL_COLS)));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/knockout-matches").then((r) => r.ok ? r.json() : { matches: [] }),
      fetch("/api/results").then((r) => r.ok ? r.json() : { results: {} }),
      fetch("/api/predictions").then((r) => r.ok ? r.json() : { predictions: {} }),
    ]).then(([knockoutData, resultsData, predData]) => {
      const rm: Record<string, ResolvedMatch> = {};
      for (const m of knockoutData.matches ?? []) rm[m.id] = { id: m.id, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId };
      setResolvedMap(rm);
      const preds: Record<string, string> = {};
      for (const [matchId, pred] of Object.entries(predData.predictions ?? {})) {
        preds[matchId] = (pred as { outcome: string }).outcome;
      }
      setUserPredictions(preds);
      const rMap: Record<string, MatchResult> = {};
      for (const [id, r] of Object.entries(resultsData.results ?? {})) {
        const res = r as { homeScore: number; awayScore: number; homePenalty?: number; awayPenalty?: number };
        rMap[id] = res;
      }
      setResultMap(rMap);
      setReady(true);
    });
  }, []);

  if (!ready || colWidth === 0) return <div ref={containerRef} className="flex justify-center py-8 text-fifa-dark-gray text-sm">Cargando bracket...</div>;

  const rowHeight = Math.round(colWidth * 0.65);
  const totalW = TOTAL_COLS * colWidth;
  const totalH = TOTAL_ROWS * rowHeight + 40;

  return (
    <div ref={containerRef} className="w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-white/30">
      <div className="relative" style={{ width: totalW, height: totalH + 30 }}>
        {/* Column headers */}
        {[
          { col: 0, label: "16vos" }, { col: 1, label: "8vos" }, { col: 2, label: "4tos" }, { col: 3, label: "Semi" },
          { col: 5, label: "Semi" }, { col: 6, label: "4tos" }, { col: 7, label: "8vos" }, { col: 8, label: "16vos" },
        ].map(({ col, label }) => (
          <div key={col} className="absolute text-center" style={{ left: col * colWidth, top: 0, width: colWidth }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">{label}</span>
          </div>
        ))}

        {/* Match boxes — offset by 30px for header space */}
        {Object.entries(POSITIONS).map(([matchId, [col, row]]) => {
          const isCenter = col === 4;
          const size = isCenter ? "lg" : col === 0 || col === 8 ? "sm" : "md";
          return (
            <div key={matchId} className="absolute" style={{
              left: col * colWidth + (colWidth - (size === "lg" ? colWidth * 0.85 : size === "md" ? colWidth * 0.8 : colWidth * 0.75)) / 2,
              top: row * rowHeight + Y_OFFSET,
            }}>
              <MatchBox matchId={matchId} resolvedMap={resolvedMap} resultMap={resultMap} userPredictions={userPredictions} colWidth={colWidth} size={size} />
            </div>
          );
        })}

        {/* Trophy + World Champion above Final */}
        <div className="absolute flex flex-col items-center" style={{ left: 4 * colWidth + (colWidth - 120) / 2, top: 0.5 * rowHeight + Y_OFFSET, width: 120 }}>
          <div className="relative w-16 h-20 mb-1">
            <Image src="/images/world-cup-trophy.png" alt="World Cup Trophy" fill className="object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-fifa-gold text-center leading-tight mb-2">World<br/>Champion</p>
          {(() => {
            const finalResult = resultMap["F"];
            const finalResolved = resolvedMap["F"];
            const hasPen = finalResult?.homePenalty != null && finalResult?.awayPenalty != null;
            const homeWins = finalResult && (hasPen ? finalResult.homePenalty! > finalResult.awayPenalty! : finalResult.homeScore > finalResult.awayScore);
            const winnerId = finalResult ? (homeWins ? finalResolved?.homeTeamId : finalResolved?.awayTeamId) : null;
            const winner = winnerId ? getTeam(winnerId) : null;
            return (
              <div className="rounded-lg ring-1 ring-fifa-gold/30 bg-fifa-gold/[0.05] px-3 py-1.5 flex items-center gap-2">
                {winner ? (
                  <>
                    <FlagImage code={winner.flagCode} name={winner.name} size="md" />
                    <span className="font-display text-sm tracking-wider text-fifa-gold">{winner.shortName}</span>
                  </>
                ) : (
                  <span className="text-lg text-fifa-dark-gray/30 px-2">?</span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Bronze Final label */}
        <div className="absolute flex flex-col items-center" style={{ left: 4 * colWidth, top: 6.3 * rowHeight + Y_OFFSET, width: colWidth }}>
          <p className="text-[7px] uppercase tracking-wider text-fifa-dark-gray/40 text-center">Bronze Final</p>
        </div>

        {/* Bracket lines — SVG overlay */}
        <svg className="absolute inset-0 pointer-events-none" width={totalW} height={totalH}>
          {/* Helper: draw line from match center-right to match center-left */}
          {[
            // Left R32 → R16
            ["R32-3", "R16-1"], ["R32-6", "R16-1"], ["R32-1", "R16-2"], ["R32-4", "R16-2"],
            ["R32-12", "R16-3"], ["R32-11", "R16-3"], ["R32-10", "R16-4"], ["R32-9", "R16-4"],
            // Left R16 → QF
            ["R16-1", "QF-1"], ["R16-2", "QF-1"], ["R16-3", "QF-2"], ["R16-4", "QF-2"],
            // Left QF → SF
            ["QF-1", "SF-1"], ["QF-2", "SF-1"],
            // Left SF → F
            ["SF-1", "F"],
            // Right R32 → R16
            ["R32-2", "R16-5"], ["R32-5", "R16-5"], ["R32-7", "R16-6"], ["R32-8", "R16-6"],
            ["R32-15", "R16-7"], ["R32-14", "R16-7"], ["R32-13", "R16-8"], ["R32-16", "R16-8"],
            // Right R16 → QF
            ["R16-5", "QF-3"], ["R16-6", "QF-3"], ["R16-7", "QF-4"], ["R16-8", "QF-4"],
            // Right QF → SF
            ["QF-3", "SF-2"], ["QF-4", "SF-2"],
            // Right SF → F
            ["SF-2", "F"],
          ].map(([from, to], i) => {
            const [fc, fr] = POSITIONS[from];
            const [tc, tr] = POSITIONS[to];
            const fromSize = fc === 0 || fc === 8 ? colWidth * 0.75 : fc === 4 ? colWidth * 0.85 : colWidth * 0.8;
            const toSize = tc === 0 || tc === 8 ? colWidth * 0.75 : tc === 4 ? colWidth * 0.85 : colWidth * 0.8;
            const fromRight = fc < tc;
            const x1 = fc * colWidth + (colWidth - fromSize) / 2 + (fromRight ? fromSize : 0);
            const y1 = fr * rowHeight + 18 + Y_OFFSET;
            const x2 = tc * colWidth + (colWidth - toSize) / 2 + (fromRight ? 0 : toSize);
            const y2 = tr * rowHeight + 18 + Y_OFFSET;
            const midX = (x1 + x2) / 2;
            return (
              <path key={i} d={`M${x1},${y1} H${midX} V${y2} H${x2}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
