"use client";

import { KnockoutMatch } from "@/types";
import { getTeam } from "@/data/teams";
import { resolveKnockoutMatch } from "@/lib/knockoutResolver";
import { usePredictions } from "@/context/PredictionsContext";
import { FlagImage } from "@/components/teams/FlagImage";
import { cn } from "@/lib/utils";

interface BracketMatchNodeProps {
  match: KnockoutMatch;
  onClick?: () => void;
}

function TeamRow({
  teamId,
  label,
  score,
  isWinner,
}: {
  teamId: string | null;
  label: string;
  score: number | undefined;
  isWinner: boolean;
}) {
  const team = teamId ? getTeam(teamId) : null;

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5",
      isWinner && "bg-fifa-green/10",
    )}>
      {team ? (
        <FlagImage code={team.flagCode} name={team.name} size="md" />
      ) : (
        <div className="flex h-6 w-8 flex-shrink-0 items-center justify-center rounded-sm bg-surface text-xs text-fifa-dark-gray/40">
          ?
        </div>
      )}
      <span
        className={cn(
          "flex-1 font-display text-sm tracking-wider",
          team ? "text-foreground" : "text-fifa-dark-gray/40",
        )}
      >
        {team ? team.shortName : label}
      </span>
      <span
        className={cn(
          "font-display text-lg",
          score !== undefined ? "text-foreground" : "text-fifa-dark-gray/20",
        )}
      >
        {score !== undefined ? score : "–"}
      </span>
    </div>
  );
}

export function BracketMatchNode({ match, onClick }: BracketMatchNodeProps) {
  const { predictions } = usePredictions();
  const resolved = resolveKnockoutMatch(match);
  const prediction = predictions[match.id];
  const hasPrediction = !!prediction;
  const predictable = resolved.homeTeamId !== null && resolved.awayTeamId !== null;

  const homeWins = hasPrediction && prediction.homeScore > prediction.awayScore;
  const awayWins = hasPrediction && prediction.homeScore < prediction.awayScore;

  return (
    <button
      type="button"
      onClick={predictable ? onClick : undefined}
      disabled={!predictable}
      className={cn(
        "w-52 overflow-hidden rounded-xl text-left transition-all duration-200",
        "bg-card-bg shadow-sm shadow-black/20 ring-1",
        predictable
          ? hasPrediction
            ? "ring-fifa-teal/30 hover:ring-fifa-teal/50 hover:shadow-lg hover:shadow-fifa-teal/10 cursor-pointer"
            : "ring-white/10 hover:ring-fifa-purple/40 hover:shadow-lg hover:shadow-fifa-purple/10 cursor-pointer"
          : "ring-white/5 opacity-40 cursor-default",
      )}
    >
      <TeamRow
        teamId={resolved.homeTeamId}
        label={match.homeSlot.label}
        score={prediction?.homeScore}
        isWinner={homeWins}
      />
      <div className="border-t border-white/5" />
      <TeamRow
        teamId={resolved.awayTeamId}
        label={match.awaySlot.label}
        score={prediction?.awayScore}
        isWinner={awayWins}
      />
    </button>
  );
}
