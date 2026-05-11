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
        "rounded-xl border bg-card-bg p-4 shadow-sm",
        locked ? "border-fifa-light-gray opacity-75" : "border-card-border",
      )}
    >
      <div className="mb-1 text-center text-xs font-medium text-fifa-dark-gray">
        {formattedDate && formattedTime
          ? `${formattedDate} · ${formattedTime}`
          : " "}
      </div>
      <div className="mb-3 text-center text-[10px] text-fifa-dark-gray/70">
        {match.venue}, {match.city}
      </div>

      {locked && (
        <div className="mb-3 flex items-center justify-center gap-1 text-xs font-medium text-fifa-red">
          <span>🔒</span> Predicción cerrada
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-2xl">{getFlagEmoji(homeTeam.flagCode)}</span>
          <span className="text-center font-display text-sm tracking-wide">
            {homeTeam.shortName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {locked ? (
            <>
              <span className="flex h-10 w-12 items-center justify-center rounded-lg bg-surface font-display text-xl text-fifa-dark-gray">
                {prediction?.homeScore ?? "–"}
              </span>
              <span className="font-display text-lg text-fifa-dark-gray">:</span>
              <span className="flex h-10 w-12 items-center justify-center rounded-lg bg-surface font-display text-xl text-fifa-dark-gray">
                {prediction?.awayScore ?? "–"}
              </span>
            </>
          ) : (
            <>
              <ScoreInput
                value={prediction?.homeScore}
                onChange={handleHomeScore}
              />
              <span className="font-display text-lg text-fifa-dark-gray">:</span>
              <ScoreInput
                value={prediction?.awayScore}
                onChange={handleAwayScore}
              />
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-2xl">{getFlagEmoji(awayTeam.flagCode)}</span>
          <span className="text-center font-display text-sm tracking-wide">
            {awayTeam.shortName}
          </span>
        </div>
      </div>
    </div>
  );
}
