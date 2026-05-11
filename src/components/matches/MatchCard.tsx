"use client";

import { useState, useEffect } from "react";
import { Match } from "@/types";
import { getTeam } from "@/data/teams";
import { getFlagEmoji } from "@/data/flags";
import { isMatchLocked } from "@/data/matches";
import { formatMatchDate, formatMatchTime, cn } from "@/lib/utils";
import { usePredictions } from "@/context/PredictionsContext";
import { ScoreInput } from "@/components/ui/ScoreInput";

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const { predictions, setPrediction } = usePredictions();
  const prediction = predictions[match.id];
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);

  const [locked, setLocked] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    setLocked(isMatchLocked(match));
    setFormattedDate(formatMatchDate(match.kickoff));
    setFormattedTime(formatMatchTime(match.kickoff));
  }, [match]);

  const handleHomeScore = (score: number) => {
    if (locked) return;
    setPrediction(match.id, score, prediction?.awayScore ?? 0);
  };

  const handleAwayScore = (score: number) => {
    if (locked) return;
    setPrediction(match.id, prediction?.homeScore ?? 0, score);
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-card-bg p-5 shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all",
        locked && "opacity-60",
      )}
    >
      <div className="mb-1.5 text-center">
        <span className="text-xs font-medium text-fifa-dark-gray">
          {formattedDate && formattedTime
            ? `${formattedDate} · ${formattedTime}`
            : " "}
        </span>
      </div>
      <div className="mb-4 text-center text-[10px] text-fifa-dark-gray/60">
        {match.venue}, {match.city}
      </div>

      {locked && (
        <div className="mb-4 flex items-center justify-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[11px] font-medium text-fifa-dark-gray mx-auto w-fit">
          🔒 Predicción cerrada
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="text-3xl">{getFlagEmoji(homeTeam.flagCode)}</span>
          <span className="font-display text-base tracking-wider text-foreground">
            {homeTeam.shortName}
          </span>
        </div>

        <div className="flex items-center gap-3 px-2">
          {locked ? (
            <>
              <span className="flex h-12 w-14 items-center justify-center rounded-xl bg-surface font-display text-2xl text-foreground">
                {prediction?.homeScore ?? "–"}
              </span>
              <span className="font-display text-xl text-fifa-dark-gray/40">:</span>
              <span className="flex h-12 w-14 items-center justify-center rounded-xl bg-surface font-display text-2xl text-foreground">
                {prediction?.awayScore ?? "–"}
              </span>
            </>
          ) : (
            <>
              <ScoreInput
                value={prediction?.homeScore}
                onChange={handleHomeScore}
              />
              <span className="font-display text-xl text-fifa-dark-gray/40">:</span>
              <ScoreInput
                value={prediction?.awayScore}
                onChange={handleAwayScore}
              />
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="text-3xl">{getFlagEmoji(awayTeam.flagCode)}</span>
          <span className="font-display text-base tracking-wider text-foreground">
            {awayTeam.shortName}
          </span>
        </div>
      </div>
    </div>
  );
}
