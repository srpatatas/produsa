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
  predictable: boolean;
}

interface MatchResult {
  homeScore: number;
  awayScore: number;
  homePenalty?: number | null;
  awayPenalty?: number | null;
}

const BRACKET_LEFT = {
  r32: ["R32-3", "R32-6", "R32-1", "R32-4", "R32-12", "R32-11", "R32-10", "R32-9"],
  r16: ["R16-1", "R16-2", "R16-3", "R16-4"],
  qf: ["QF-1", "QF-2"],
  sf: ["SF-1"],
};

const BRACKET_RIGHT = {
  r32: ["R32-2", "R32-5", "R32-7", "R32-8", "R32-15", "R32-14", "R32-13", "R32-16"],
  r16: ["R16-5", "R16-6", "R16-7", "R16-8"],
  qf: ["QF-3", "QF-4"],
  sf: ["SF-2"],
};

function TeamSlot({
  teamId,
  label,
  score,
  penalty,
  isWinner,
  isLoser,
  large,
}: {
  teamId: string | null;
  label: string;
  score?: number;
  penalty?: number | null;
  isWinner?: boolean;
  isLoser?: boolean;
  large?: boolean;
}) {
  const team = teamId ? getTeam(teamId) : null;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 rounded-md transition-opacity",
      large ? "py-1.5" : "py-1",
      isLoser && "opacity-30",
    )}>
      {team ? (
        <FlagImage code={team.flagCode} name={team.name} size={large ? "md" : "sm"} />
      ) : (
        <div className={cn("rounded-sm bg-white/10 flex items-center justify-center text-[8px] text-white/30", large ? "h-5 w-7" : "h-4 w-5")}>?</div>
      )}
      <span className={cn(
        "flex-1 font-display tracking-wider truncate",
        large ? "text-xs" : "text-[10px]",
        team ? "text-foreground" : "text-fifa-dark-gray/30",
        isWinner && "text-fifa-gold",
      )}>
        {team ? team.shortName : label}
      </span>
      {penalty != null && <span className="text-[8px] text-fifa-dark-gray/50">({penalty})</span>}
      {score != null && (
        <span className={cn(
          "font-bold text-right",
          large ? "text-sm w-4" : "text-[10px] w-3",
          isWinner ? "text-foreground" : "text-fifa-dark-gray/50",
        )}>
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({
  match,
  resolved,
  result,
  large,
}: {
  match: KnockoutMatch;
  resolved?: ResolvedMatch;
  result?: MatchResult;
  large?: boolean;
}) {
  const isFinished = !!result;
  const hasPenalties = result?.homePenalty != null && result?.awayPenalty != null;
  const homeWins = isFinished && (hasPenalties ? result.homePenalty! > result.awayPenalty! : result.homeScore > result.awayScore);
  const awayWins = isFinished && (hasPenalties ? result.awayPenalty! > result.homePenalty! : result.awayScore > result.homeScore);

  return (
    <div className={cn(
      "rounded-lg ring-1 overflow-hidden",
      isFinished ? "ring-white/15 bg-white/[0.03]" : "ring-white/5 bg-white/[0.02]",
      large ? "min-w-[140px]" : "min-w-[120px]",
    )}>
      <TeamSlot
        teamId={resolved?.homeTeamId ?? null}
        label={match.homeSlot.label}
        score={isFinished ? result.homeScore : undefined}
        penalty={hasPenalties ? result.homePenalty : undefined}
        isWinner={homeWins}
        isLoser={awayWins}
        large={large}
      />
      <div className="h-px bg-white/5" />
      <TeamSlot
        teamId={resolved?.awayTeamId ?? null}
        label={match.awaySlot.label}
        score={isFinished ? result.awayScore : undefined}
        penalty={hasPenalties ? result.awayPenalty : undefined}
        isWinner={awayWins}
        isLoser={homeWins}
        large={large}
      />
    </div>
  );
}

function BracketColumn({
  matchIds,
  matchMap,
  resolvedMap,
  resultMap,
  large,
}: {
  matchIds: string[];
  matchMap: Map<string, KnockoutMatch>;
  resolvedMap: Record<string, ResolvedMatch>;
  resultMap: Record<string, MatchResult>;
  large?: boolean;
}) {
  return (
    <div className="flex flex-col justify-around h-full gap-1">
      {matchIds.map((id) => {
        const match = matchMap.get(id);
        if (!match) return null;
        return (
          <MatchCard
            key={id}
            match={match}
            resolved={resolvedMap[id]}
            result={resultMap[id]}
            large={large}
          />
        );
      })}
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
      for (const m of knockoutData.matches ?? []) {
        rm[m.id] = { id: m.id, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, predictable: m.predictable };
      }
      setResolvedMap(rm);

      const rMap: Record<string, MatchResult> = {};
      for (const [id, r] of Object.entries(resultsData.results ?? {})) {
        const res = r as { matchId: string; homeScore: number; awayScore: number; homePenalty?: number; awayPenalty?: number };
        rMap[id] = { homeScore: res.homeScore, awayScore: res.awayScore, homePenalty: res.homePenalty, awayPenalty: res.awayPenalty };
      }
      setResultMap(rMap);
      setReady(true);
    });
  }, []);

  const matchMap = new Map(knockoutMatches.map((m) => [m.id, m]));

  if (!ready) return <div className="flex justify-center py-8 text-fifa-dark-gray text-sm">Cargando bracket...</div>;

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[1000px] relative">
        {/* Column headers */}
        <div className="grid grid-cols-9 gap-1 mb-2 px-1">
          {["16vos", "8vos", "4tos", "Semi", "Final", "Semi", "4tos", "8vos", "16vos"].map((label, i) => (
            <div key={i} className={cn(
              "text-center text-[8px] font-semibold uppercase tracking-widest",
              i === 4 ? "text-fifa-gold" : "text-fifa-dark-gray/50",
            )}>
              {label}
            </div>
          ))}
        </div>

        {/* Bracket grid */}
        <div className="grid grid-cols-9 gap-1 px-1" style={{ minHeight: "650px" }}>
          {/* Left R32 */}
          <BracketColumn matchIds={BRACKET_LEFT.r32} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} />
          {/* Left R16 */}
          <BracketColumn matchIds={BRACKET_LEFT.r16} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} large />
          {/* Left QF */}
          <BracketColumn matchIds={BRACKET_LEFT.qf} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} large />
          {/* Left SF */}
          <BracketColumn matchIds={BRACKET_LEFT.sf} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} large />

          {/* Center: Champion + Final + 3P + Trophy */}
          <div className="flex flex-col items-center justify-between py-4">
            <div className="text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest text-fifa-gold mb-2">World Champion</p>
              <MatchCard match={matchMap.get("F")!} resolved={resolvedMap["F"]} result={resultMap["F"]} large />
            </div>

            <div className="text-center">
              <p className="text-[7px] uppercase tracking-wider text-fifa-dark-gray/40 mb-1">Bronze Final</p>
              <MatchCard match={matchMap.get("3P")!} resolved={resolvedMap["3P"]} result={resultMap["3P"]} />
            </div>

            <div className="relative w-24 h-32">
              <Image src="/images/world-cup-trophy.png" alt="World Cup Trophy" fill className="object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]" />
            </div>
          </div>

          {/* Right SF */}
          <BracketColumn matchIds={BRACKET_RIGHT.sf} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} large />
          {/* Right QF */}
          <BracketColumn matchIds={BRACKET_RIGHT.qf} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} large />
          {/* Right R16 */}
          <BracketColumn matchIds={BRACKET_RIGHT.r16} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} large />
          {/* Right R32 */}
          <BracketColumn matchIds={BRACKET_RIGHT.r32} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} />
        </div>
      </div>
    </div>
  );
}
