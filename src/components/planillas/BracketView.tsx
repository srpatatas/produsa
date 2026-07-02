"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { knockoutMatches } from "@/data/knockoutMatches";
import { KnockoutMatch } from "@/types";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { cn } from "@/lib/utils";

interface ResolvedMatch {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

interface MatchResult {
  homeScore: number;
  awayScore: number;
  homePenalty?: number | null;
  awayPenalty?: number | null;
}

function TeamRow({ teamId, label, score, penalty, isWinner, isLoser }: {
  teamId: string | null; label: string; score?: number; penalty?: number | null; isWinner?: boolean; isLoser?: boolean;
}) {
  const team = teamId ? getTeam(teamId) : null;
  return (
    <div className={cn("flex items-center gap-1 px-1.5 py-0.5", isLoser && "opacity-30")}>
      {team ? (
        <FlagImage code={team.flagCode} name={team.name} size="sm" />
      ) : (
        <div className="h-3.5 w-5 rounded-[2px] bg-white/10 flex items-center justify-center text-[7px] text-white/30">?</div>
      )}
      <span className={cn("flex-1 text-[9px] font-display tracking-wider truncate", team ? "text-foreground" : "text-white/20", isWinner && "text-fifa-gold")}>
        {team ? team.shortName : ""}
      </span>
      {penalty != null && <span className="text-[7px] text-white/30">({penalty})</span>}
      {score != null && <span className={cn("text-[9px] font-bold w-2.5 text-right", isWinner ? "text-foreground" : "text-white/40")}>{score}</span>}
    </div>
  );
}

function MatchBox({ matchId, resolvedMap, resultMap }: {
  matchId: string;
  resolvedMap: Record<string, ResolvedMatch>;
  resultMap: Record<string, MatchResult>;
}) {
  const match = knockoutMatches.find((m) => m.id === matchId);
  if (!match) return <div className="w-[100px] h-[30px]" />;
  const resolved = resolvedMap[matchId];
  const result = resultMap[matchId];
  const isFinished = !!result;
  const hasPen = result?.homePenalty != null && result?.awayPenalty != null;
  const homeWins = isFinished && (hasPen ? result.homePenalty! > result.awayPenalty! : result.homeScore > result.awayScore);
  const awayWins = isFinished && (hasPen ? result.awayPenalty! > result.homePenalty! : result.awayScore > result.homeScore);

  return (
    <div className={cn("w-[100px] rounded-md ring-1 overflow-hidden", isFinished ? "ring-white/15 bg-white/[0.04]" : "ring-white/5 bg-white/[0.02]")}>
      <TeamRow teamId={resolved?.homeTeamId ?? null} label={match.homeSlot.label} score={isFinished ? result.homeScore : undefined} penalty={hasPen ? result.homePenalty : undefined} isWinner={homeWins} isLoser={awayWins} />
      <div className="h-px bg-white/5" />
      <TeamRow teamId={resolved?.awayTeamId ?? null} label={match.awaySlot.label} score={isFinished ? result.awayScore : undefined} penalty={hasPen ? result.awayPenalty : undefined} isWinner={awayWins} isLoser={homeWins} />
    </div>
  );
}

function BracketPair({ top, bottom, next, resolvedMap, resultMap, side }: {
  top: string; bottom: string; next?: string;
  resolvedMap: Record<string, ResolvedMatch>; resultMap: Record<string, MatchResult>;
  side: "left" | "right";
}) {
  const isLeft = side === "left";
  return (
    <div className="flex items-center">
      {!isLeft && next && (
        <div className="flex flex-col items-center justify-center mx-1">
          <MatchBox matchId={next} resolvedMap={resolvedMap} resultMap={resultMap} />
        </div>
      )}
      {!isLeft && next && <div className={cn("w-3 self-stretch flex flex-col justify-center")}><div className="border-l border-white/10 h-1/2" /><div className="border-l border-white/10 h-1/2" /></div>}
      <div className="flex flex-col gap-1">
        <div className="flex items-center">
          <MatchBox matchId={top} resolvedMap={resolvedMap} resultMap={resultMap} />
          {isLeft && <div className="w-3 border-t border-white/10" />}
          {!isLeft && <div className="w-3 border-t border-white/10 order-first" />}
        </div>
        <div className="flex items-center">
          <MatchBox matchId={bottom} resolvedMap={resolvedMap} resultMap={resultMap} />
          {isLeft && <div className="w-3 border-t border-white/10" />}
          {!isLeft && <div className="w-3 border-t border-white/10 order-first" />}
        </div>
      </div>
      {isLeft && <div className={cn("w-0 self-stretch flex flex-col justify-center")}><div className="border-r border-white/10 h-1/2" /><div className="border-r border-white/10 h-1/2" /></div>}
      {isLeft && next && (
        <div className="flex flex-col items-center justify-center mx-1">
          <MatchBox matchId={next} resolvedMap={resolvedMap} resultMap={resultMap} />
        </div>
      )}
    </div>
  );
}

function HalfBracket({ r32, r16, qf, sf, resolvedMap, resultMap, side }: {
  r32: string[]; r16: string[]; qf: string[]; sf: string[];
  resolvedMap: Record<string, ResolvedMatch>; resultMap: Record<string, MatchResult>;
  side: "left" | "right";
}) {
  const isLeft = side === "left";
  return (
    <div className="flex flex-col justify-evenly h-full">
      {/* Top bracket: R32[0-3] → R16[0-1] → QF[0] → SF[0] */}
      <div className={cn("flex items-center", isLeft ? "" : "flex-row-reverse")}>
        {/* R32 pairs */}
        <div className="flex flex-col gap-4">
          <BracketPair top={r32[0]} bottom={r32[1]} resolvedMap={resolvedMap} resultMap={resultMap} side={side} />
          <BracketPair top={r32[2]} bottom={r32[3]} resolvedMap={resolvedMap} resultMap={resultMap} side={side} />
        </div>
        {/* Connector */}
        <div className={cn("flex flex-col justify-evenly h-full mx-1")}>
          <MatchBox matchId={r16[0]} resolvedMap={resolvedMap} resultMap={resultMap} />
          <MatchBox matchId={r16[1]} resolvedMap={resolvedMap} resultMap={resultMap} />
        </div>
        <div className="flex flex-col justify-center mx-1">
          <MatchBox matchId={qf[0]} resolvedMap={resolvedMap} resultMap={resultMap} />
        </div>
        <div className="flex flex-col justify-center mx-1">
          <MatchBox matchId={sf[0]} resolvedMap={resolvedMap} resultMap={resultMap} />
        </div>
      </div>
      {/* Bottom bracket: R32[4-7] → R16[2-3] → QF[1] */}
      <div className={cn("flex items-center", isLeft ? "" : "flex-row-reverse")}>
        <div className="flex flex-col gap-4">
          <BracketPair top={r32[4]} bottom={r32[5]} resolvedMap={resolvedMap} resultMap={resultMap} side={side} />
          <BracketPair top={r32[6]} bottom={r32[7]} resolvedMap={resolvedMap} resultMap={resultMap} side={side} />
        </div>
        <div className={cn("flex flex-col justify-evenly h-full mx-1")}>
          <MatchBox matchId={r16[2]} resolvedMap={resolvedMap} resultMap={resultMap} />
          <MatchBox matchId={r16[3]} resolvedMap={resolvedMap} resultMap={resultMap} />
        </div>
        <div className="flex flex-col justify-center mx-1">
          <MatchBox matchId={qf[1]} resolvedMap={resolvedMap} resultMap={resultMap} />
        </div>
      </div>
    </div>
  );
}

export function BracketView() {
  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolvedMatch>>({});
  const [resultMap, setResultMap] = useState<Record<string, MatchResult>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/knockout-matches").then((r) => r.ok ? r.json() : { matches: [] }),
      fetch("/api/results").then((r) => r.ok ? r.json() : { results: {} }),
    ]).then(([knockoutData, resultsData]) => {
      const rm: Record<string, ResolvedMatch> = {};
      for (const m of knockoutData.matches ?? []) rm[m.id] = { id: m.id, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId };
      setResolvedMap(rm);
      const rMap: Record<string, MatchResult> = {};
      for (const [id, r] of Object.entries(resultsData.results ?? {})) {
        const res = r as { homeScore: number; awayScore: number; homePenalty?: number; awayPenalty?: number };
        rMap[id] = res;
      }
      setResultMap(rMap);
      setReady(true);
    });
  }, []);

  if (!ready) return <div className="flex justify-center py-8 text-fifa-dark-gray text-sm">Cargando bracket...</div>;

  const LEFT = { r32: ["R32-3", "R32-6", "R32-1", "R32-4", "R32-12", "R32-11", "R32-10", "R32-9"], r16: ["R16-1", "R16-2", "R16-3", "R16-4"], qf: ["QF-1", "QF-2"], sf: ["SF-1"] };
  const RIGHT = { r32: ["R32-2", "R32-5", "R32-7", "R32-8", "R32-15", "R32-14", "R32-13", "R32-16"], r16: ["R16-5", "R16-6", "R16-7", "R16-8"], qf: ["QF-3", "QF-4"], sf: ["SF-2"] };

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="min-w-[900px]">
        {/* Main bracket */}
        <div className="flex">
          {/* Left half */}
          <HalfBracket r32={LEFT.r32} r16={LEFT.r16} qf={LEFT.qf} sf={LEFT.sf} resolvedMap={resolvedMap} resultMap={resultMap} side="left" />

          {/* Center: Final + Trophy */}
          <div className="flex flex-col items-center justify-start pt-16 px-4 min-w-[140px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-fifa-gold mb-2">World Champion</p>
            <MatchBox matchId="F" resolvedMap={resolvedMap} resultMap={resultMap} />
            <div className="relative w-28 h-36 mt-3">
              <Image src="/images/world-cup-trophy.png" alt="World Cup Trophy" fill className="object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]" />
            </div>
            <p className="text-[7px] uppercase tracking-wider text-fifa-dark-gray/30 mt-4 mb-1">3er puesto</p>
            <div className="opacity-50">
              <MatchBox matchId="3P" resolvedMap={resolvedMap} resultMap={resultMap} />
            </div>
          </div>

          {/* Right half */}
          <HalfBracket r32={RIGHT.r32} r16={RIGHT.r16} qf={RIGHT.qf} sf={RIGHT.sf} resolvedMap={resolvedMap} resultMap={resultMap} side="right" />
        </div>
      </div>
    </div>
  );
}
