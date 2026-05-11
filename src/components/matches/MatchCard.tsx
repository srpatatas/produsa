"use client";

import { useState, useEffect } from "react";
import { Match } from "@/types";
import { getTeam } from "@/data/teams";
import { isMatchLocked } from "@/data/matches";
import { formatMatchDate, formatMatchTime, cn } from "@/lib/utils";
import { usePredictions } from "@/context/PredictionsContext";
import { ScoreInput } from "@/components/ui/ScoreInput";
import { FlagImage } from "@/components/teams/FlagImage";

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const { predictions, setPrediction, removePrediction } = usePredictions();
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
        "relative rounded-2xl bg-card-bg p-5 shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all duration-200",
        locked ? "opacity-60" : "hover:ring-white/15 hover:shadow-md hover:shadow-black/30",
      )}
    >
      <div className="mb-1.5 text-center">
        <span className="text-xs font-medium text-fifa-dark-gray">
          {formattedDate && formattedTime
            ? `${formattedDate} · ${formattedTime}`
            : " "}
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

      {!locked && prediction && (
        <button
          type="button"
          onClick={() => removePrediction(match.id)}
          title="Borrar predicción"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-fifa-dark-gray/30 transition-all hover:bg-fifa-red/10 hover:text-fifa-red"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-1 flex-col items-center gap-2">
          <FlagImage code={homeTeam.flagCode} name={homeTeam.name} size="lg" />
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
          <FlagImage code={awayTeam.flagCode} name={awayTeam.name} size="lg" />
          <span className="font-display text-base tracking-wider text-foreground">
            {awayTeam.shortName}
          </span>
        </div>
      </div>
    </div>
  );
}
