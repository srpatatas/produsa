import { Match } from "@/types";
import { getTeam } from "@/data/teams";
import { getFlagEmoji } from "@/data/flags";
import { LiveScore } from "@/data/liveScores";

interface LiveScoreboardProps {
  match: Match;
  liveScore: LiveScore;
}

export function LiveScoreboard({ match, liveScore }: LiveScoreboardProps) {
  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fifa-blue via-fifa-blue to-indigo-900 p-6 text-white shadow-xl shadow-fifa-blue/20">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-fifa-red" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            En vivo · {liveScore.minute}&apos;
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-1 flex-col items-center gap-2">
            <span className="text-5xl">{getFlagEmoji(home.flagCode)}</span>
            <span className="font-display text-xl tracking-wider">{home.shortName}</span>
          </div>

          <div className="flex items-center gap-4 px-4">
            <span className="font-display text-6xl">
              {liveScore.homeScore}
            </span>
            <span className="text-2xl text-white/30">:</span>
            <span className="font-display text-6xl">
              {liveScore.awayScore}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <span className="text-5xl">{getFlagEmoji(away.flagCode)}</span>
            <span className="font-display text-xl tracking-wider">{away.shortName}</span>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-white/40">
          {match.venue}, {match.city}
        </div>
      </div>
    </div>
  );
}
