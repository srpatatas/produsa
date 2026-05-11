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
    <div className="rounded-2xl border border-fifa-green/30 bg-gradient-to-b from-fifa-blue to-fifa-blue/90 p-5 text-white shadow-lg">
      <div className="mb-1 flex items-center justify-center gap-2">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-fifa-red" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
          En vivo · {liveScore.minute}&apos;
        </span>
      </div>

      <div className="mb-3 text-center text-[10px] text-white/50">
        {match.venue}, {match.city}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-4xl">{getFlagEmoji(home.flagCode)}</span>
          <span className="text-sm font-bold">{home.shortName}</span>
        </div>

        <div className="flex items-center gap-3 px-4">
          <span className="font-display text-5xl font-extrabold">
            {liveScore.homeScore}
          </span>
          <span className="text-2xl font-light text-white/50">:</span>
          <span className="font-display text-5xl font-extrabold">
            {liveScore.awayScore}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-4xl">{getFlagEmoji(away.flagCode)}</span>
          <span className="text-sm font-bold">{away.shortName}</span>
        </div>
      </div>
    </div>
  );
}
