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
}: {
  teamId: string | null;
  label: string;
  score: number | undefined;
}) {
  const team = teamId ? getTeam(teamId) : null;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1">
      {team ? (
        <FlagImage code={team.flagCode} name={team.name} size="sm" />
      ) : (
        <div className="flex h-4 w-6 flex-shrink-0 items-center justify-center rounded-sm bg-surface text-[8px] text-fifa-dark-gray/40">
          ?
        </div>
      )}
      <span
        className={cn(
          "flex-1 font-display text-[11px] tracking-wider",
          team ? "text-foreground" : "text-fifa-dark-gray/40",
        )}
      >
        {team ? team.shortName : label}
      </span>
      <span
        className={cn(
          "font-display text-sm",
          score !== undefined ? "text-foreground" : "text-fifa-dark-gray/30",
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

  return (
    <button
      type="button"
      onClick={predictable ? onClick : undefined}
      disabled={!predictable}
      className={cn(
        "w-40 rounded-lg text-left transition-all duration-200",
        "bg-card-bg shadow-sm shadow-black/20 ring-1",
        predictable
          ? hasPrediction
            ? "ring-fifa-teal/30 hover:ring-fifa-teal/50 hover:shadow-lg cursor-pointer"
            : "ring-white/10 hover:ring-fifa-purple/40 hover:shadow-lg cursor-pointer"
          : "ring-white/5 opacity-40 cursor-default",
      )}
    >
      <TeamRow
        teamId={resolved.homeTeamId}
        label={match.homeSlot.label}
        score={prediction?.homeScore}
      />
      <div className="border-t border-white/5" />
      <TeamRow
        teamId={resolved.awayTeamId}
        label={match.awaySlot.label}
        score={prediction?.awayScore}
      />
    </button>
  );
}
