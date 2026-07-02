"use client";

import { useEffect, useState } from "react";
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

function formatTime(kickoff: string): string {
  return new Date(kickoff).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }) + " " + new Date(kickoff).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function MatchCard({
  match,
  resolved,
  result,
  compact,
  reverse,
}: {
  match: KnockoutMatch;
  resolved?: ResolvedMatch;
  result?: MatchResult;
  compact?: boolean;
  reverse?: boolean;
}) {
  const home = resolved?.homeTeamId ? getTeam(resolved.homeTeamId) : null;
  const away = resolved?.awayTeamId ? getTeam(resolved.awayTeamId) : null;
  const isFinished = !!result;
  const hasPenalties = result?.homePenalty != null && result?.awayPenalty != null;

  return (
    <div className={cn(
      "rounded-lg ring-1 overflow-hidden",
      isFinished ? "ring-white/20 bg-card-bg" : "ring-white/5 bg-surface/50",
      compact ? "w-[130px]" : "w-[150px]",
    )}>
      {!compact && (
        <div className={cn(
          "px-2 py-0.5 text-[8px] text-fifa-dark-gray/60",
          reverse ? "text-right" : "text-left",
        )}>
          {isFinished ? "Finalizado" : formatTime(match.kickoff)}
        </div>
      )}
      <div className="space-y-px">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1",
          isFinished && result.homeScore < result.awayScore && !hasPenalties && "opacity-40",
          isFinished && hasPenalties && result.homePenalty! < result.awayPenalty! && "opacity-40",
        )}>
          {home ? (
            <>
              <FlagImage code={home.flagCode} name={home.name} size="sm" />
              <span className="flex-1 text-[10px] font-display tracking-wider text-foreground truncate">{home.shortName}</span>
            </>
          ) : (
            <span className="flex-1 text-[9px] text-fifa-dark-gray/40 truncate">{match.homeSlot.label}</span>
          )}
          {hasPenalties && <span className="text-[8px] text-fifa-dark-gray/50">({result.homePenalty})</span>}
          {isFinished && <span className="text-[10px] font-bold text-foreground w-3 text-right">{result.homeScore}</span>}
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1",
          isFinished && result.awayScore < result.homeScore && !hasPenalties && "opacity-40",
          isFinished && hasPenalties && result.awayPenalty! < result.homePenalty! && "opacity-40",
        )}>
          {away ? (
            <>
              <FlagImage code={away.flagCode} name={away.name} size="sm" />
              <span className="flex-1 text-[10px] font-display tracking-wider text-foreground truncate">{away.shortName}</span>
            </>
          ) : (
            <span className="flex-1 text-[9px] text-fifa-dark-gray/40 truncate">{match.awaySlot.label}</span>
          )}
          {hasPenalties && <span className="text-[8px] text-fifa-dark-gray/50">({result.awayPenalty})</span>}
          {isFinished && <span className="text-[10px] font-bold text-foreground w-3 text-right">{result.awayScore}</span>}
        </div>
      </div>
    </div>
  );
}

function BracketColumn({
  matchIds,
  matchMap,
  resolvedMap,
  resultMap,
  compact,
  reverse,
}: {
  matchIds: string[];
  matchMap: Map<string, KnockoutMatch>;
  resolvedMap: Record<string, ResolvedMatch>;
  resultMap: Record<string, MatchResult>;
  compact?: boolean;
  reverse?: boolean;
}) {
  return (
    <div className="flex flex-col justify-around h-full gap-2">
      {matchIds.map((id) => {
        const match = matchMap.get(id);
        if (!match) return null;
        return (
          <MatchCard
            key={id}
            match={match}
            resolved={resolvedMap[id]}
            result={resultMap[id]}
            compact={compact}
            reverse={reverse}
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
      {/* Column headers */}
      <div className="min-w-[1100px]">
        <div className="grid grid-cols-9 gap-1 mb-3 px-2">
          <div className="text-center text-[9px] font-semibold uppercase tracking-wider text-fifa-dark-gray">16vos</div>
          <div className="text-center text-[9px] font-semibold uppercase tracking-wider text-fifa-dark-gray">8vos</div>
          <div className="text-center text-[9px] font-semibold uppercase tracking-wider text-fifa-dark-gray">4tos</div>
          <div className="text-center text-[9px] font-semibold uppercase tracking-wider text-fifa-dark-gray">Semi</div>
          <div className="text-center text-[9px] font-semibold uppercase tracking-wider text-fifa-gold">Final</div>
          <div className="text-center text-[9px] font-semibold uppercase tracking-wider text-fifa-dark-gray">Semi</div>
          <div className="text-center text-[9px] font-semibold uppercase tracking-wider text-fifa-dark-gray">4tos</div>
          <div className="text-center text-[9px] font-semibold uppercase tracking-wider text-fifa-dark-gray">8vos</div>
          <div className="text-center text-[9px] font-semibold uppercase tracking-wider text-fifa-dark-gray">16vos</div>
        </div>

        {/* Bracket grid */}
        <div className="grid grid-cols-9 gap-1 px-2" style={{ minHeight: "700px" }}>
          {/* Left R32 */}
          <BracketColumn matchIds={BRACKET_LEFT.r32} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} compact />
          {/* Left R16 */}
          <BracketColumn matchIds={BRACKET_LEFT.r16} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} />
          {/* Left QF */}
          <BracketColumn matchIds={BRACKET_LEFT.qf} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} />
          {/* Left SF */}
          <BracketColumn matchIds={BRACKET_LEFT.sf} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} />
          {/* Center: Final + 3P */}
          <div className="flex flex-col justify-center items-center gap-6">
            <MatchCard match={matchMap.get("F")!} resolved={resolvedMap["F"]} result={resultMap["F"]} />
            <div className="text-[8px] text-fifa-dark-gray/40 uppercase tracking-wider">3er puesto</div>
            <MatchCard match={matchMap.get("3P")!} resolved={resolvedMap["3P"]} result={resultMap["3P"]} compact />
          </div>
          {/* Right SF */}
          <BracketColumn matchIds={BRACKET_RIGHT.sf} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} reverse />
          {/* Right QF */}
          <BracketColumn matchIds={BRACKET_RIGHT.qf} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} reverse />
          {/* Right R16 */}
          <BracketColumn matchIds={BRACKET_RIGHT.r16} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} reverse />
          {/* Right R32 */}
          <BracketColumn matchIds={BRACKET_RIGHT.r32} matchMap={matchMap} resolvedMap={resolvedMap} resultMap={resultMap} compact reverse />
        </div>
      </div>
    </div>
  );
}
