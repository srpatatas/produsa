"use client";

import { useState, useEffect } from "react";
import { KnockoutMatch } from "@/types";
import { getTeam } from "@/data/teams";
import { isKnockoutMatchLocked } from "@/data/knockoutMatches";
import { resolveKnockoutMatch, isKnockoutMatchPredictable } from "@/lib/knockoutResolver";
import { formatMatchDate, formatMatchTime, cn } from "@/lib/utils";
import { usePredictions } from "@/context/PredictionsContext";
import { ScoreInput } from "@/components/ui/ScoreInput";
import { FlagImage } from "@/components/teams/FlagImage";
import { PenaltyPicker } from "./PenaltyPicker";

interface KnockoutMatchCardProps {
  match: KnockoutMatch;
}

export function KnockoutMatchCard({ match }: KnockoutMatchCardProps) {
  const { predictions, setPrediction, removePrediction } = usePredictions();
  const prediction = predictions[match.id];

  const resolved = resolveKnockoutMatch(match);
  const predictable = isKnockoutMatchPredictable(match);
  const homeTeam = resolved.homeTeamId ? getTeam(resolved.homeTeamId) : null;
  const awayTeam = resolved.awayTeamId ? getTeam(resolved.awayTeamId) : null;

  const [locked, setLocked] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    setLocked(isKnockoutMatchLocked(match));
    setFormattedDate(formatMatchDate(match.kickoff));
    setFormattedTime(formatMatchTime(match.kickoff));
  }, [match]);

  const isDraw = prediction && prediction.homeScore === prediction.awayScore;

  const handleHomeScore = (score: number) => {
    if (locked || !predictable) return;
    setPrediction(match.id, score, prediction?.awayScore ?? 0);
  };

  const handleAwayScore = (score: number) => {
    if (locked || !predictable) return;
    setPrediction(match.id, prediction?.homeScore ?? 0, score);
  };

  const handlePenaltyWinner = (winner: "home" | "away") => {
    if (!prediction) return;
    setPrediction(match.id, prediction.homeScore, prediction.awayScore);
    // Update with penalty winner — need to set it directly since setPrediction doesn't have that param
    // We'll use a workaround through the predictions map
    predictions[match.id] = { ...predictions[match.id], penaltyWinner: winner };
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-card-bg p-5 shadow-sm shadow-black/20 ring-1 ring-white/5 transition-all duration-200",
        !predictable && "opacity-50",
        predictable && !locked && "hover:ring-white/15 hover:shadow-md hover:shadow-black/30",
        locked && "opacity-60",
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

      {!predictable && (
        <div className="mb-4 flex items-center justify-center rounded-full bg-surface px-3 py-1 text-[10px] font-medium text-fifa-dark-gray mx-auto w-fit">
          Completá las fases previas
        </div>
      )}

      {locked && predictable && (
        <div className="mb-4 flex items-center justify-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[11px] font-medium text-fifa-dark-gray mx-auto w-fit">
          🔒 Predicción cerrada
        </div>
      )}

      {!locked && predictable && prediction && (
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
          {homeTeam ? (
            <>
              <FlagImage code={homeTeam.flagCode} name={homeTeam.name} size="lg" />
              <span className="font-display text-base tracking-wider text-foreground">
                {homeTeam.shortName}
              </span>
            </>
          ) : (
            <>
              <div className="flex h-9 w-12 items-center justify-center rounded-sm bg-surface text-lg text-fifa-dark-gray/40">
                ?
              </div>
              <span className="text-center text-[10px] text-fifa-dark-gray">
                {match.homeSlot.label}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 px-2">
          {predictable && !locked ? (
            <div className="flex items-center gap-3">
              <ScoreInput
                value={prediction?.homeScore}
                onChange={handleHomeScore}
              />
              <span className="font-display text-xl text-fifa-dark-gray/40">:</span>
              <ScoreInput
                value={prediction?.awayScore}
                onChange={handleAwayScore}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-14 items-center justify-center rounded-xl bg-surface font-display text-2xl text-foreground">
                {prediction?.homeScore ?? "–"}
              </span>
              <span className="font-display text-xl text-fifa-dark-gray/40">:</span>
              <span className="flex h-12 w-14 items-center justify-center rounded-xl bg-surface font-display text-2xl text-foreground">
                {prediction?.awayScore ?? "–"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-2">
          {awayTeam ? (
            <>
              <FlagImage code={awayTeam.flagCode} name={awayTeam.name} size="lg" />
              <span className="font-display text-base tracking-wider text-foreground">
                {awayTeam.shortName}
              </span>
            </>
          ) : (
            <>
              <div className="flex h-9 w-12 items-center justify-center rounded-sm bg-surface text-lg text-fifa-dark-gray/40">
                ?
              </div>
              <span className="text-center text-[10px] text-fifa-dark-gray">
                {match.awaySlot.label}
              </span>
            </>
          )}
        </div>
      </div>

      {isDraw && predictable && !locked && homeTeam && awayTeam && (
        <PenaltyPicker
          homeTeamId={homeTeam.id}
          awayTeamId={awayTeam.id}
          selected={prediction?.penaltyWinner}
          onChange={handlePenaltyWinner}
        />
      )}
    </div>
  );
}
