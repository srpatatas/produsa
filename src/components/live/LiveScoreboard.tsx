import { UnifiedMatch, LiveScore } from "@/types";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { LiveEventTimeline } from "./LiveEventTimeline";

interface LiveScoreboardProps {
  match: UnifiedMatch;
  liveScore: LiveScore;
  stale?: boolean;
}

export function LiveScoreboard({ match, liveScore, stale = false }: LiveScoreboardProps) {
  const home = match.homeTeamId ? getTeam(match.homeTeamId) : null;
  const away = match.awayTeamId ? getTeam(match.awayTeamId) : null;
  const hasScore = liveScore.homeScore >= 0 && liveScore.awayScore >= 0;
  const status = liveScore.status;
  const events = liveScore.events ?? [];

  const statusLabels: Record<string, string> = {
    HT: "Entretiempo",
    ET: "Tiempo extra",
    P: "Penales",
    BT: "Entretiempo",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fifa-purple via-fifa-blue to-fifa-teal p-6 text-white shadow-xl shadow-fifa-purple/20">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-fifa-lime/10" />
      <div className="absolute -left-4 bottom-4 h-16 w-16 rounded-full bg-fifa-red/10" />
      <div className="absolute right-12 bottom-0 h-10 w-10 rounded-full bg-white/5" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fifa-red opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-fifa-red" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            {!hasScore
              ? "En vivo · Esperando datos"
              : status && statusLabels[status]
                ? `En vivo · ${statusLabels[status]}`
                : stale
                  ? `En vivo · ${liveScore.minute}' (última actualización)`
                  : liveScore.extra
                    ? `En vivo · ${liveScore.minute}+${liveScore.extra}'`
                    : `En vivo · ${liveScore.minute}'`}
          </span>
        </div>

        <div className="flex min-w-0 items-start justify-between">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
            {home ? (
              <>
                <FlagImage code={home.flagCode} name={home.name} size="lg" />
                <span className="font-display text-base tracking-wider sm:text-xl">{home.shortName}</span>
              </>
            ) : (
              <span className="text-sm text-white/50">{match.homeLabel}</span>
            )}
            {events.length > 0 && (
              <div className="mt-1 w-full px-0.5 sm:px-1">
                <LiveEventTimeline events={events} side="home" />
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 px-1 pt-3 sm:gap-4 sm:px-4" aria-live="polite" aria-atomic="true">
            <span className="font-display text-4xl leading-none sm:text-7xl">
              {hasScore ? liveScore.homeScore : "–"}
            </span>
            <span className="text-xl text-white/20 sm:text-3xl">:</span>
            <span className="font-display text-4xl leading-none sm:text-7xl">
              {hasScore ? liveScore.awayScore : "–"}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
            {away ? (
              <>
                <FlagImage code={away.flagCode} name={away.name} size="lg" />
                <span className="font-display text-base tracking-wider sm:text-xl">{away.shortName}</span>
              </>
            ) : (
              <span className="text-sm text-white/50">{match.awayLabel}</span>
            )}
            {events.length > 0 && (
              <div className="mt-1 w-full px-0.5 sm:px-1">
                <LiveEventTimeline events={events} side="away" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-white/30">
          {match.venue}, {match.city}
        </div>
      </div>
    </div>
  );
}
